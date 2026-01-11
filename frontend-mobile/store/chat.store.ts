import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';
// Cleared flags are intentionally kept in-memory for guest users so that
// non-logged-in users lose their history on app restart. Persisting these
// flags would keep a 'cleared' state across restarts which we don't want for
// guest flows. If persistence for logged-in users is desired, we should
// implement a user-scoped persistence (e.g. save to Supabase or to
// AsyncStorage keyed by user id).

export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  exhibitionId?: number;
  artworkId?: string;
  artworkTitle?: string;
  artworkImage?: string;
};

type ChatHistory = {
  messages: Message[];
};

type State = {
  chatHistories: Record<number, ChatHistory>;
  // 기록이 삭제된 전시를 표시합니다(비로그인 사용자가 삭제한 경우 재생성 방지)
  clearedExhibitions: Record<number, boolean>;
  // timestamp (ms) when a guest cleared histories last occurred. Used to
  // suppress immediate welcome-message recreation that may be triggered by
  // leftover navigation params.
  justClearedAt?: number | null;
  currentSessionId: number | null; // 🔥 추가: 현재 활성화된 세션 ID
  setCurrentSessionId: (id: number | null) => void;
  getChatHistory: (exhibitionId: number) => ChatHistory | undefined;
  addMessage: (exhibitionId: number, message: Message) => void;
  // Replace the entire chat history for an exhibition. Used when loading
  // a persisted session from the server so the local UI reflects the
  // saved conversation exactly (complete replacement).
  setChatHistory: (exhibitionId: number, messages: Message[]) => void;
  clearChatHistory: (exhibitionId: number) => void;
  clearAllChatHistories: () => void;
  markAllCleared: () => void;
  markExhibitionCleared: (exhibitionId: number) => void;
  isExhibitionCleared: (exhibitionId: number) => boolean;
};

export const useChatStore = create<State>((set, get) => ({
  chatHistories: {},
  clearedExhibitions: {},
  currentSessionId: null, // 초기값 null
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  getChatHistory: (exhibitionId: number) => get().chatHistories[exhibitionId],
  addMessage: (exhibitionId: number, message: Message) => {
    const { chatHistories } = get();
    const existingHistory = chatHistories[exhibitionId] || { messages: [] };
    // Prevent adding messages with duplicate ids (defensive dedupe).
    if (existingHistory.messages.some((m) => m.id === message.id)) {
      console.log('[ChatStore] skip addMessage - duplicate id=', message.id);
      return;
    }
    // When adding a message to an exhibition that was previously cleared,
    // remove the cleared flag so future visits will behave normally.
    if (get().clearedExhibitions[exhibitionId]) {
      // If this exhibition was previously marked cleared, remove the flag
      // when the user adds a message so the exhibition behaves normally.
      const updated = { ...get().clearedExhibitions, [exhibitionId]: false };
      set({ clearedExhibitions: updated });
    }
    set({
      chatHistories: {
        ...chatHistories,
        [exhibitionId]: {
          messages: [...existingHistory.messages, message],
        },
      },
    });
  },
  setChatHistory: (exhibitionId: number, messages: Message[]) => {
    const { chatHistories } = get();
    set({
      chatHistories: {
        ...chatHistories,
        [exhibitionId]: { messages },
      },
    });
    // When explicitly setting a history coming from the DB, clear any
    // cleared flag for that exhibition so UI behaves normally.
    if (get().clearedExhibitions[exhibitionId]) {
      const updated = { ...get().clearedExhibitions, [exhibitionId]: false };
      set({ clearedExhibitions: updated });
    }
  },
  clearChatHistory: (exhibitionId: number) => {
    // Log current history before clearing for debugging/audit
    const current = get().chatHistories[exhibitionId];
    if (current) {
      try {
        console.log(`[ChatStore] clearChatHistory -> exhibitionId=${exhibitionId}, messages=`, JSON.parse(JSON.stringify(current.messages)));
      } catch (e: any) {
        console.log(`[ChatStore] clearChatHistory -> exhibitionId=${exhibitionId}, messages count=`, current.messages.length);
      }
    } else {
      console.log(`[ChatStore] clearChatHistory -> exhibitionId=${exhibitionId}, no messages`);
    }

    const { [exhibitionId]: _, ...rest } = get().chatHistories;
    // Clear the chat history for this exhibition and mark it cleared in-memory
    // so that returning to the same exhibition during this session does not
    // auto-recreate welcome messages. This flag is NOT persisted.
    const updatedCleared = { ...get().clearedExhibitions, [exhibitionId]: true };
    set({ chatHistories: rest, clearedExhibitions: updatedCleared, justClearedAt: Date.now() });
  },
  clearAllChatHistories: () => {
    // Remove all chat histories for guest users. Mark each previously-known
    // exhibition id as cleared (in-memory) so returning to those specific
    // exhibitions in this session won't auto-recreate welcomes. Do NOT set a
    // global __all__ flag because that would block welcomes for new
    // exhibitions as well.
    const prevIds = Object.keys(get().chatHistories).map((k) => Number(k));
    const updatedCleared = prevIds.reduce((acc, id) => ({ ...acc, [id]: true }), { ...get().clearedExhibitions });
    set({ chatHistories: {}, clearedExhibitions: updatedCleared, justClearedAt: Date.now() });
  },
  markExhibitionCleared: (exhibitionId: number) => {
    const updatedCleared = { ...get().clearedExhibitions, [exhibitionId]: true };
    set({ clearedExhibitions: updatedCleared, justClearedAt: Date.now() });
  },
  // mark all exhibitions as cleared (used when guest switches gallery)
  markAllCleared: () => {
    const updatedCleared = { ...get().clearedExhibitions, __all__: true } as Record<string, any>;
    set({ clearedExhibitions: updatedCleared, justClearedAt: Date.now() });
  },
  isExhibitionCleared: (exhibitionId: number) => {
    const flags = get().clearedExhibitions;
    if (!flags) return false;
    if ((flags as any).__all__) return true;
    return !!flags[exhibitionId];
  },
}));

// Note: clearedExhibitions is intentionally NOT persisted for guest users.
// If you want to persist cleared flags for logged-in users, implement a
// user-scoped persistence that saves/restores per-user state (e.g. save to
// Supabase or to AsyncStorage keyed by user id) and restore during auth init.

// Cleanup old persisted key from earlier versions that persisted clearedExhibitions.
// This runs once on module load and ensures any previously stored `__all__` or
// per-exhibition flags do not leak into the new guest-in-memory behavior.
(async () => {
  try {
    await AsyncStorage.removeItem('chat.clearedExhibitions');
    console.log('[ChatStore] removed legacy persisted clearedExhibitions');
  } catch (e: any) {
    console.log('[ChatStore] failed to remove legacy clearedExhibitions', e);
  }
})();