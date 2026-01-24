import { supabase } from "@/services/supabase";
import { Message } from "@/store/chat.store";

// Cached flag whether the `chat_messages.image_url` column exists in the DB.
let hasImageUrlColumn: boolean | null = null;

// 🔒 중복 저장 방지를 위한 실행 중인 저장 작업 추적
const savingOperations = new Map<string, Promise<number | null>>();

function getSaveKey(userId: string, exhibitionId: number, sessionId: number | null): string {
  return `${userId}-${exhibitionId}-${sessionId ?? 'new'}`;
}

async function ensureImageUrlColumn(): Promise<boolean> {
  if (hasImageUrlColumn !== null) return hasImageUrlColumn;
  // Probe the column by selecting it; if it doesn't exist the request will
  // return a Postgres error (42703). We ignore other errors and assume the
  // column is missing in that case to preserve backward compatibility.
  try {
    const { error } = await supabase
      .from('chat_messages')
      .select('image_url')
      .limit(1);
    if (error) {
      // column missing or other issue
      hasImageUrlColumn = false;
    } else {
      hasImageUrlColumn = true;
    }
  } catch (e) {
    hasImageUrlColumn = false;
  }
  return hasImageUrlColumn;
}

export const ChatDatabaseService = {
  async saveFullHistory(
    userId: string, 
    exhibitionId: number, 
    messages: Message[], 
    exhibitionName: string,
    sessionId?: number | null, // 🔥 추가: 외부에서 세션 ID를 받음
    ageGroup?: string | null, 
    expertiseLevel?: string | null
  ) {
    if (messages.length === 0) return null;

    // 🔒 중복 실행 방지: 같은 저장 작업이 이미 진행 중이면 대기
    const saveKey = getSaveKey(userId, exhibitionId, sessionId);
    if (savingOperations.has(saveKey)) {
      console.log('[ChatDatabaseService] 🔒 중복 저장 방지 - 이미 진행 중인 저장 작업 대기:', saveKey);
      return await savingOperations.get(saveKey)!;
    }

    // 저장 작업 시작
    const savePromise = (async () => {
      try {
        return await this._saveFullHistoryInternal(userId, exhibitionId, messages, exhibitionName, sessionId, ageGroup, expertiseLevel);
      } finally {
        // 저장 완료 후 맵에서 제거
        savingOperations.delete(saveKey);
      }
    })();

    savingOperations.set(saveKey, savePromise);
    return await savePromise;
  },

  async _saveFullHistoryInternal(
    userId: string, 
    exhibitionId: number, 
    messages: Message[], 
    exhibitionName: string,
    sessionId?: number | null,
    ageGroup?: string | null, 
    expertiseLevel?: string | null
  ): Promise<number | null> {
    let activeSessionId = sessionId;

    // 1. 세션 ID가 없는 경우에만 새로 생성 (3개 제한 체크 포함)
    if (!activeSessionId) {
      console.log('[ChatDatabaseService] 🔵 saveFullHistory에서 세션 자동 생성 시도:', {
        userId,
        exhibitionId,
        exhibitionName,
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      });

      // 세션 개수 제한 확인 (3개까지)
      const existingSessions = await this.listSessions(userId, exhibitionId);
      console.log('[ChatDatabaseService] 🔵 saveFullHistory 기존 세션 개수:', existingSessions.length, existingSessions.map(s => ({ id: s.id, title: s.title, created_at: s.created_at })));
      
      // 🔒 중복 세션 생성 방지: 최근에 생성된 세션이 있고 메시지가 없는 경우 재사용
      if (existingSessions.length > 0) {
        const mostRecentSession = existingSessions[0]; // 가장 최근 세션
        const { data: sessionMessages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('session_id', mostRecentSession.id)
          .limit(1);
        
        // 최근 세션이 있고 메시지가 없으면 재사용 (중복 생성 방지)
        if (!sessionMessages || sessionMessages.length === 0) {
          console.log('[ChatDatabaseService] 🔵 최근 세션 재사용 (메시지 없음):', {
            sessionId: mostRecentSession.id,
            title: mostRecentSession.title
          });
          activeSessionId = mostRecentSession.id;
        } else if (existingSessions.length >= 3) {
          console.error('[ChatDatabaseService] ❌ saveFullHistory 세션 개수 제한 초과:', existingSessions.length);
          throw new Error('전시당 최대 3개의 세션만 생성할 수 있습니다. 기존 세션을 삭제한 후 새로 생성해주세요.');
        }
      }
      
      // 여전히 세션이 없으면 새로 생성
      if (!activeSessionId) {
        const { data: history, error: historyError } = await supabase
          .from('chat_history')
          .insert({ user_id: userId, exhibition_id: exhibitionId, title: exhibitionName })
          .select()
          .single();

        if (historyError) {
          console.error('[ChatDatabaseService] ❌ saveFullHistory 세션 생성 DB 오류:', historyError);
          throw historyError;
        }
        
        activeSessionId = history.id;
        console.log('[ChatDatabaseService] ✅ saveFullHistory에서 세션 자동 생성 완료:', {
          sessionId: activeSessionId,
          title: exhibitionName,
          userId,
          exhibitionId
        });
      }
    }

    // 2. 해당 세션의 기존 메시지 확인 (중복 방지)
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true });

    let newMessages = messages;
    if (existingMessages && existingMessages.length > 0) {
      // 🔒 강화된 중복 체크: 모든 메시지가 이미 저장되어 있는지 확인
      if (existingMessages.length >= messages.length) {
        // DB 메시지와 입력 메시지를 순서대로 비교
        let allMatch = true;
        for (let i = 0; i < messages.length; i++) {
          const dbMsg = existingMessages[i];
          const inputMsg = messages[i];
          
          if (!dbMsg || 
              dbMsg.content !== inputMsg.text || 
              dbMsg.role !== (inputMsg.isUser ? 'user' : 'assistant')) {
            allMatch = false;
            break;
          }
        }
        
        if (allMatch) {
          // 모든 메시지가 이미 저장되어 있음
          console.log('[ChatDatabaseService] 🔵 모든 메시지가 이미 저장되어 있음, 중복 저장 방지', {
            sessionId: activeSessionId,
            existingCount: existingMessages.length,
            inputCount: messages.length
          });
          return activeSessionId;
        }
      }
      
      // 마지막 메시지 기준으로 새 메시지만 필터링
      const lastDbMsg = existingMessages[existingMessages.length - 1];
      const lastIndex = messages.findLastIndex(m => 
        m.text === lastDbMsg.content && 
        (m.isUser ? 'user' : 'assistant') === lastDbMsg.role
      );
      if (lastIndex !== -1) {
        newMessages = messages.slice(lastIndex + 1);
        console.log('[ChatDatabaseService] 🔵 기존 메시지 필터링:', {
          originalCount: messages.length,
          newCount: newMessages.length,
          lastIndex
        });
      }
    }

    if (newMessages.length === 0) {
      console.log('[ChatDatabaseService] 🔵 저장할 새 메시지 없음');
      return activeSessionId;
    }

    // 4. 새 메시지 저장 로직 (기존과 동일하되 activeSessionId 사용)
    // 🔒 추가 중복 체크: 저장 직전에 다시 확인
    if (newMessages.length > 0) {
      const { data: lastCheck } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(newMessages.length);
      
      // 마지막 저장된 메시지들과 새로 저장할 메시지들 비교
      if (lastCheck && lastCheck.length > 0) {
        const lastCheckMsg = lastCheck[0];
        const firstNewMsg = newMessages[0];
        
        // 첫 번째 새 메시지가 이미 마지막에 저장되어 있으면 중복 저장 방지
        if (lastCheckMsg.content === firstNewMsg.text && 
            lastCheckMsg.role === (firstNewMsg.isUser ? 'user' : 'assistant')) {
          console.log('[ChatDatabaseService] 🔒 저장 직전 중복 감지, 저장 취소:', {
            sessionId: activeSessionId,
            duplicateMessage: firstNewMsg.text.substring(0, 50)
          });
          return activeSessionId;
        }
      }
    }

    const includeImage = await ensureImageUrlColumn();
    const messagesToInsert = newMessages.map((m) => ({
      session_id: activeSessionId,
      artwork_id: (m.artworkId && m.artworkId.length > 20) ? m.artworkId : null,
      role: m.isUser ? 'user' : 'assistant',
      content: m.text,
      created_at: m.timestamp,
      age_group: ageGroup ?? null,
      expertise_level: expertiseLevel ?? null,
      image_url: m.artworkImage || null,
    }));

    console.log('[ChatDatabaseService] 💾 메시지 저장 시작:', {
      sessionId: activeSessionId,
      messageCount: messagesToInsert.length,
      messages: messagesToInsert.map(m => ({ content: m.content.substring(0, 30) + '...', role: m.role }))
    });

    const { error: msgError } = await supabase.from('chat_messages').insert(messagesToInsert);
    if (msgError) {
      console.error('[ChatDatabaseService] ❌ 메시지 저장 실패:', msgError);
      throw msgError;
    }
    
    console.log('[ChatDatabaseService] ✅ 메시지 저장 완료:', {
      sessionId: activeSessionId,
      savedCount: messagesToInsert.length
    });

    return activeSessionId; // 생성되거나 사용된 ID 반환
  },
  async listSessions(userId: string, exhibitionId: number) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Array<{ id: number; title: string; created_at: string; updated_at: string }>;
  },

  async loadSessionMessages(sessionId: number) {
    const includeImage = await ensureImageUrlColumn();
    const selectCols = includeImage
      ? 'id, session_id, artwork_id, role, content, created_at, age_group, expertise_level, image_url'
      : 'id, session_id, artwork_id, role, content, created_at, age_group, expertise_level';

    const { data, error } = await supabase
      .from('chat_messages')
      .select(selectCols)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Map DB rows to local Message shape
    return (data || []).map((row: any) => ({
      id: `db-${row.id}`,
      text: row.content,
      isUser: row.role === 'user',
      timestamp: new Date(row.created_at),
      exhibitionId: undefined,
      artworkId: row.artwork_id ?? undefined,
      artworkTitle: undefined,
      artworkImage: includeImage ? (row.image_url ?? undefined) : undefined,
      // keep age/expertise on messages if needed elsewhere
      // age_group: row.age_group,
      // expertise_level: row.expertise_level,
    }));
  },

  async createSession(userId: string, exhibitionId: number, title?: string) {
    console.log('[ChatDatabaseService] 🔵 createSession 호출:', {
      userId,
      exhibitionId,
      title,
      timestamp: new Date().toISOString()
    });

    // 세션 개수 제한 확인 (3개까지)
    const existingSessions = await this.listSessions(userId, exhibitionId);
    console.log('[ChatDatabaseService] 🔵 기존 세션 개수:', existingSessions.length, existingSessions.map(s => ({ id: s.id, title: s.title, created_at: s.created_at })));
    
    if (existingSessions.length >= 3) {
      console.error('[ChatDatabaseService] ❌ 세션 개수 제한 초과:', existingSessions.length);
      throw new Error('전시당 최대 3개의 세션만 생성할 수 있습니다. 기존 세션을 삭제한 후 새로 생성해주세요.');
    }

    const { data, error } = await supabase
      .from('chat_history')
      .insert({ user_id: userId, exhibition_id: exhibitionId, title: title ?? `세션 ${new Date().toLocaleString()}` })
      .select()
      .single();

    if (error) {
      console.error('[ChatDatabaseService] ❌ createSession DB 오류:', error);
      throw error;
    }
    
    console.log('[ChatDatabaseService] ✅ 세션 생성 완료:', {
      sessionId: data.id,
      title: data.title,
      created_at: data.created_at,
      userId,
      exhibitionId
    });
    
    return data as { id: number; title: string; created_at: string };
  },

  async deleteSession(sessionId: number) {
    // 1. 메시지 삭제
    const { error: msgError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (msgError) throw msgError;

    // 2. 세션(히스토리) 삭제
    const { error: historyError } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', sessionId);

    if (historyError) throw historyError;

    return true;
  },

  async getSessionInfo(sessionId: number) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('id, title, created_at, updated_at')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data as { id: number; title: string; created_at: string; updated_at: string } | null;
  },

  /**
   * 전시 변경 시 현재 세션 저장
   * @param userId 사용자 ID
   * @param exhibitionId 전시 ID
   * @param messages 저장할 메시지 목록
   * @param exhibitionName 전시 이름
   * @param sessionId 세션 ID (있으면 기존 세션에 저장, 없으면 새로 생성)
   * @param ageGroup 연령대
   * @param expertiseLevel 전문성 수준
   * @returns 저장된 세션 ID 또는 null
   */
  async saveOnExhibitionChange(
    userId: string,
    exhibitionId: number,
    messages: Message[],
    exhibitionName: string,
    sessionId?: number | null,
    ageGroup?: string | null,
    expertiseLevel?: string | null
  ): Promise<number | null> {
    if (messages.length === 0) {
      console.log('[ChatDatabaseService] No messages to save');
      return null;
    }
    console.log(messages);
    try {
      const savedSessionId = await this.saveFullHistory(
        userId,
        exhibitionId,
        messages,
        exhibitionName,
        sessionId,
        ageGroup,
        expertiseLevel
      );
      console.log('[ChatDatabaseService] ✅ Saved session on exhibition change', savedSessionId);
      return savedSessionId ?? null;
    } catch (e: any) {
      console.error('[ChatDatabaseService] ❌ Failed to save on exhibition change:', e);
      throw e;
    }
  },

  /**
   * 세션 변경 시 현재 세션 저장
   * @param userId 사용자 ID
   * @param exhibitionId 전시 ID
   * @param messages 저장할 메시지 목록
   * @param exhibitionName 전시 이름
   * @param prevSessionId 이전 세션 ID
   * @param ageGroup 연령대
   * @param expertiseLevel 전문성 수준
   * @returns 저장된 세션 ID 또는 null
   */
  async saveOnSessionChange(
    userId: string,
    exhibitionId: number,
    messages: Message[],
    exhibitionName: string,
    prevSessionId: number | null,
    ageGroup?: string | null,
    expertiseLevel?: string | null
  ): Promise<number | null> {
    if (messages.length === 0) {
      console.log('[ChatDatabaseService] No messages to save on session change');
      return null;
    }

    if (!prevSessionId) {
      console.log('[ChatDatabaseService] No previous session ID to save');
      return null;
    }

    try {
      const savedSessionId = await this.saveFullHistory(
        userId,
        exhibitionId,
        messages,
        exhibitionName,
        prevSessionId,
        ageGroup,
        expertiseLevel
      );
      console.log('[ChatDatabaseService] ✅ Saved session on session change', savedSessionId);
      return savedSessionId ?? null;
    } catch (e: any) {
      console.error('[ChatDatabaseService] ❌ Failed to save on session change:', e);
      throw e;
    }
  }
};