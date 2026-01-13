import { supabase } from "@/services/supabase";
import { Message } from "@/store/chat.store";

// Cached flag whether the `chat_messages.image_url` column exists in the DB.
let hasImageUrlColumn: boolean | null = null;

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
      
      if (existingSessions.length >= 3) {
        console.error('[ChatDatabaseService] ❌ saveFullHistory 세션 개수 제한 초과:', existingSessions.length);
        throw new Error('전시당 최대 3개의 세션만 생성할 수 있습니다. 기존 세션을 삭제한 후 새로 생성해주세요.');
      }

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

    // 2. 해당 세션의 마지막 메시지 확인 (중복 방지)
    const { data: lastDbMsg } = await supabase
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // 데이터가 없을 수 있으므로 single() 대신 maybeSingle()

    let newMessages = messages;
    if (lastDbMsg) {
      const lastIndex = messages.findLastIndex(m => 
        m.text === lastDbMsg.content && 
        (m.isUser ? 'user' : 'assistant') === lastDbMsg.role
      );
      if (lastIndex !== -1) {
        newMessages = messages.slice(lastIndex + 1);
      }
    }

    if (newMessages.length === 0) return activeSessionId;

    // 4. 새 메시지 저장 로직 (기존과 동일하되 activeSessionId 사용)
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

    const { error: msgError } = await supabase.from('chat_messages').insert(messagesToInsert);
    if (msgError) throw msgError;

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