import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useChatStore, Message } from "@/store/chat.store";
import { useAuth } from "@/store/auth.store";
import { ChatbotService } from "@/services/chatbot";
import SessionListModal from '@/components/SessionListModal';
import { ChatDatabaseService } from '@/services/chathistory_service';

const EMPTY_MESSAGES: Message[] = [];

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    artworkId?: string;
    artworkTitle?: string;
    artworkArtist?: string;
    artworkImage?: string;
    artworkYear?: string;
  }>();

  useEffect(() => {
    console.log("[ChatScreen][params]", {
      artworkId: params.artworkId,
      artworkTitle: params.artworkTitle,
      artworkImage: params.artworkImage,
    });
  }, [params.artworkId, params.artworkImage]);

  /** ===== 전역 상태 ===== */
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  const galleryId = useOnboardingStore((s) => s.gallery);
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);

  const user = useAuth((s) => s.user);
  const isLoggedIn = !!user;

  /** ===== 채팅 스토어 ===== */
  const messages = useChatStore((s) =>
    exhibitionId !== undefined
      ? s.chatHistories[exhibitionId]?.messages ?? EMPTY_MESSAGES
      : EMPTY_MESSAGES
  );
  const addMessage = useChatStore((s) => s.addMessage);
  const setChatHistory = useChatStore((s) => s.setChatHistory);
  const clearChatHistory = useChatStore((s) => s.clearChatHistory);

  /** ===== 로컬 UI 상태 ===== */
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  /** ===== ref ===== */
  const prevArtworkIdRef = useRef<string | undefined>(undefined);
  const prevExhibitionIdRef = useRef<number | undefined>(exhibitionId);

  /** ===== 현재 artworkId ===== */
  const currentArtworkId = useMemo(() => {
    if (params.artworkId) return params.artworkId;
    return messages.length
      ? [...messages].reverse().find((m) => m.artworkId)?.artworkId
      : undefined;
  }, [params.artworkId, messages]);

  /** ======================================================
   *  1️⃣ 전시 변경 처리 (비로그인 시 히스토리 삭제)
   * ====================================================== */
  useEffect(() => {
    const prev = prevExhibitionIdRef.current;
    if (prev !== undefined && prev !== exhibitionId) {
      if (!isLoggedIn) {
        clearChatHistory(prev);
        console.log(`[ChatScreen] cleared chat history for prev exhibition=${prev} due to exhibition change and not logged in`);
      }
      setMessage("");
      prevArtworkIdRef.current = undefined;
    }
    prevExhibitionIdRef.current = exhibitionId;
  }, [exhibitionId, isLoggedIn]);

  // DEBUG: log messages whenever exhibitionId or messages change
  useEffect(() => {
    try {
      console.log(`[ChatScreen] exhibitionId=${exhibitionId}, messages count=${messages.length}`, JSON.parse(JSON.stringify(messages)));
    } catch (e) {
      console.log('[ChatScreen] failed to stringify messages', e, `count=${messages.length}`);
    }
  }, [exhibitionId, messages]);

  /** ======================================================
   *  2️⃣ 웰컴 메시지 (🔥 핵심)
   *  → artworkId “변경” 시에만 실행
   * ====================================================== */
  useEffect(() => {
  if (!exhibitionId) return;
  if (!params.artworkId || !params.artworkTitle) return;

  // If this exhibition was cleared (guest cleared history), skip auto welcome
  const isCleared =
    useChatStore.getState().isExhibitionCleared &&
    useChatStore.getState().isExhibitionCleared(exhibitionId);
  // Also check for a global clear flag (__all__) persisted in the store.
  const clearedFlags = useChatStore.getState().clearedExhibitions;
  const isGlobalCleared = (clearedFlags as any)?.__all__;

  // If the store was just cleared (guest action), suppress welcome creation
  // briefly to avoid recreating welcomes from leftover navigation params.
  const justClearedAt = useChatStore.getState().justClearedAt;
  const JUST_CLEARED_WINDOW_MS = 3000;
  if (justClearedAt && Date.now() - justClearedAt < JUST_CLEARED_WINDOW_MS) {
    console.log('[ChatScreen] skip welcome (recent clear)', { justClearedAt, now: Date.now() });
    prevArtworkIdRef.current = params.artworkId;
    return;
  }

  if (isCleared) {
    // If the entire set was cleared by the guest (global clear), don't auto-
    // generate welcomes at all — the guest explicitly opted to remove history.
    if (isGlobalCleared) {
      console.log('[ChatScreen] skip welcome (global clear __all__)');
      prevArtworkIdRef.current = params.artworkId;
      return;
    }

    // Otherwise (per-exhibition cleared), we should still allow a new welcome when the
    // incoming artwork differs from the artwork present in existing messages.
    const existingArtworkId = messages.length
      ? [...messages].reverse().find((m) => m.artworkId)?.artworkId
      : undefined;

  console.log('[ChatScreen] isCleared=', isCleared, 'existingArtworkId=', existingArtworkId, 'incoming=', params.artworkId, 'isGlobalCleared=', isGlobalCleared);

    // If there is already a message for the same artwork, skip welcoming again.
    if (existingArtworkId && existingArtworkId === params.artworkId) {
      console.log(`[ChatScreen] skip welcome (cleared & existing welcome for same artwork)`);
      prevArtworkIdRef.current = params.artworkId;
      return;
    }
    // Otherwise (no existing artwork or different artwork) allow welcome creation.
  }

  // ✅ 1. 카메라 이벤트 기준 (artworkId 변경)
  if (params.artworkId === prevArtworkIdRef.current) return;

  // ✅ 2. 스토어 기준 중복 방어 (핵심)
  const alreadyHasWelcome = messages.some(
    (m) =>
      m.id.startsWith("welcome-") &&
      m.artworkId === params.artworkId
  );
  if (alreadyHasWelcome) {
    prevArtworkIdRef.current = params.artworkId;
    return;
  }

  prevArtworkIdRef.current = params.artworkId;

  const welcomeMessage: Message = {
    id: `welcome-${exhibitionId}-${params.artworkId}`, // ✅ Date.now 제거 (중복 방지)
    text: `${params.artworkTitle}${
      params.artworkArtist ? ` - ${params.artworkArtist}` : ""
    }에 대해 궁금한 점이 있으신가요? 질문을 남겨주세요.`,
    isUser: false,
    timestamp: new Date(),
    exhibitionId: exhibitionId,
    artworkId: params.artworkId,
    artworkTitle: params.artworkTitle,
    artworkImage: params.artworkImage,
  };
  console.log("[ChatScreen][welcomeMessage:create]", {
    artworkId: params.artworkId,
    artworkTitle: params.artworkTitle,
    artworkImage: params.artworkImage,
  });
  addMessage(exhibitionId, welcomeMessage);
}, [params.artworkId, exhibitionId, messages]);
  /** ===== 자동 스크롤 ===== */
  useEffect(() => {
    const t = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  /** ===== 카메라 ===== */
  const handleCameraPress = () => {
    if (!exhibitionId) return;
    router.push({ pathname: "/camera", params: { exhibitionId: String(exhibitionId) } });
  };

  /** ===== 메시지 전송 ===== */
  const handleSendMessage = async () => {
    if (!message.trim() || !currentArtworkId || !exhibitionId) {
      Alert.alert("알림", "작품을 먼저 선택해주세요.");
      return;
    }
    if (!age || !aesthetic) {
      Alert.alert("오류", "온보딩 설정을 완료해주세요.");
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: message.trim(),
      isUser: true,
      timestamp: new Date(),
      exhibitionId: exhibitionId,
      artworkId: currentArtworkId,
      artworkTitle: params.artworkTitle,
      artworkImage: params.artworkImage,
    };

    addMessage(exhibitionId, userMsg);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await ChatbotService.askQuestion({
        artwork_id: currentArtworkId,
        question: userMsg.text,
        age_group: age as any,
        expertise_level: aesthetic as any,
      });

      addMessage(exhibitionId, {
        id: `bot-${Date.now()}`,
        text: res.answer,
        isUser: false,
        timestamp: new Date(),
        exhibitionId: exhibitionId,
        artworkId: currentArtworkId,
      });
    } catch {
      addMessage(exhibitionId, {
        id: `error-${Date.now()}`,
        text: "답변 생성 중 오류가 발생했습니다.",
        isUser: false,
        timestamp: new Date(),
        exhibitionId: exhibitionId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ===== UI ===== */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {(currentArtworkId || messages.length > 0) ? (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          >
            {messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showImage =
                msg.artworkImage && (!prev || prev.artworkId !== msg.artworkId);

              return (
                <View key={msg.id}>
                  {showImage && (
                    <View style={{ marginBottom: 16 }}>
                      <Image
                        source={{ uri: msg.artworkImage }}
                        style={{ width: "50%", aspectRatio: 1, borderRadius: 12 }}
                      />
                      <Text style={{ marginTop: 8, fontWeight: "600" }}>
                        {msg.artworkTitle}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      alignItems: msg.isUser ? "flex-end" : "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: msg.isUser ? "#007AFF" : "#f0f0f0",
                        padding: 12,
                        borderRadius: 16,
                        maxWidth: "80%",
                      }}
                    >
                      <Text style={{ color: msg.isUser ? "#fff" : "#000" }}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // When a gallery is selected but no exhibition is chosen, prompt user to
          // select an exhibition and disable camera/chat inputs.
          !exhibitionId && galleryId ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="event" size={48} color="#666" />
              <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "600" }}>전시를 선택해주세요</Text>
              <Text style={{ marginTop: 8, color: "#666" }}>상단에서 전시를 선택하면 채팅과 카메라 기능을 사용할 수 있습니다.</Text>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="camera-alt" size={48} color="#007AFF" />
              <Text style={{ marginTop: 12 }}>작품을 촬영해주세요</Text>
            </View>
          )
        )}

        {/* 입력 */}
        <View style={{ flexDirection: "row", padding: 12, paddingBottom: 100, alignItems: 'center' }}>
          {exhibitionId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isLoggedIn && (
                <Pressable
                  onPress={() => setShowSessions(true)}
                  style={{ marginRight: 8 }}
                >
                  <MaterialIcons name="list" size={24} color="#007AFF" />
                </Pressable>
              )}

              <Pressable onPress={handleCameraPress}>
                <MaterialIcons name="camera-alt" size={24} color="#007AFF" />
              </Pressable>
            </View>
          ) : (
            <View style={{ padding: 6 }}>
              <MaterialIcons name="camera-alt" size={24} color="#ccc" />
            </View>
          )}

          <TextInput
            style={{ flex: 1, marginHorizontal: 8, backgroundColor: "#f5f5f5", borderRadius: 20, padding: 10 }}
            value={message}
            onChangeText={setMessage}
            editable={!!currentArtworkId && !!exhibitionId && !isLoading}
            placeholder={exhibitionId ? "작품에 대해 질문해보세요" : "전시를 선택해주세요"}
          />

          {exhibitionId && currentArtworkId ? (
            <Pressable onPress={handleSendMessage}>
              <MaterialIcons name="send" size={24} color="#007AFF" />
            </Pressable>
          ) : (
            <View style={{ padding: 6 }}>
              <MaterialIcons name="send" size={24} color="#ccc" />
            </View>
          )}
        </View>
        <SessionListModal
          // Only allow the modal to be visible when an exhibition is selected.
          visible={showSessions && !!exhibitionId}
          exhibitionId={exhibitionId}
          onClose={() => setShowSessions(false)}
          onSelectSession={async (sessionId) => {
            try {
              setShowSessions(false);
              if (!exhibitionId) return;
              const rows = await ChatDatabaseService.loadSessionMessages(sessionId);
              // Replace local history with loaded messages so UI shows them as a real chat
              setChatHistory(exhibitionId, rows);
              useChatStore.getState().setCurrentSessionId(sessionId);
            } catch (e) {
              console.log('[ChatScreen] loadSessionMessages error', e);
            }
          }}
          onCreateNew={async (sessionId) => {
            // A new session was created on the server — start with an empty local
            // history for this exhibition so the user can begin chatting.
            setShowSessions(false);
            if (!exhibitionId) return;
            setChatHistory(exhibitionId, []);
            useChatStore.getState().setCurrentSessionId(sessionId);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}