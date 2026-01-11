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

    // 1. 세션 ID가 없는 경우에만 새로 생성
    if (!activeSessionId) {
      const { data: history, error: historyError } = await supabase
        .from('chat_history')
        .insert({ user_id: userId, exhibition_id: exhibitionId, title: exhibitionName })
        .select()
        .single();

      if (historyError) throw historyError;
      activeSessionId = history.id;
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
    const { data, error } = await supabase
      .from('chat_history')
      .insert({ user_id: userId, exhibition_id: exhibitionId, title: title ?? `세션 ${new Date().toLocaleString()}` })
      .select()
      .single();

    if (error) throw error;
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
  }
};