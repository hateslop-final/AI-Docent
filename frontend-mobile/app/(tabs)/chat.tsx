import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useChatStore, Message } from "@/store/chat.store";
import { useAuth } from "@/store/auth.store";
import { ChatbotService } from "@/services/chatbot";
import SessionListModal from '@/components/SessionListModal';
import ChatInput from '@/components/ChatInput';
import { ChatDatabaseService } from '@/services/chathistory_service';
import { fetchExhibitions, Exhibition } from "@/services/exhibition";
import { fetchGalleries, Gallery } from "@/services/gallery";

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
  const currentSessionId = useChatStore((s) => s.currentSessionId);

  /** ===== 로컬 UI 상태 ===== */
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 갤러리 및 전시 정보 로드
  useEffect(() => {
    fetchGalleries()
      .then(setGalleries)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (exhibitionId && galleryId) {
      fetchExhibitions(galleryId)
        .then(setExhibitions)
        .catch(console.error);
    }
  }, [exhibitionId, galleryId]);

  // 현재 갤러리와 전시 정보
  const currentGallery = useMemo(() => {
    if (!galleryId || !galleries.length) return null;
    return galleries.find((g) => g.id === galleryId) || null;
  }, [galleryId, galleries]);

  const currentExhibition = useMemo(() => {
    if (!exhibitionId || !exhibitions.length) return null;
    return exhibitions.find((e) => e.id === exhibitionId) || null;
  }, [exhibitionId, exhibitions]);

  // 현재 갤러리와 전시명 로그 출력
  useEffect(() => {
    if (currentGallery || currentExhibition) {
      console.log("[ChatScreen] 현재 선택된 정보:", {
        갤러리: currentGallery?.name || "없음",
        전시: currentExhibition?.name || "없음",
        galleryId,
        exhibitionId,
      });
    }
  }, [currentGallery, currentExhibition, galleryId, exhibitionId]);

  // 과거 전시인지 확인
  const isPastExhibition = useMemo(() => {
    if (!currentExhibition) return false;
    const now = new Date();
    
    // show가 false이면 과거 전시로 간주하지 않음
    if (currentExhibition.show === false) return false;
    
    if (!currentExhibition.start_date && !currentExhibition.end_date) {
      return currentExhibition.is_now !== true;
    }
    
    if (currentExhibition.end_date) {
      const endDate = new Date(currentExhibition.end_date);
      return endDate < now;
    }
    
    return currentExhibition.is_now !== true;
  }, [currentExhibition]);

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
      setSessionTitle(null); // 전시 변경 시 세션 제목 초기화
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

  /** ===== 세션 제목 로드 ===== */
  useEffect(() => {
    async function loadSessionTitle() {
      if (!isLoggedIn || !currentSessionId) {
        setSessionTitle(null);
        return;
      }

      try {
        const sessionInfo = await ChatDatabaseService.getSessionInfo(currentSessionId);
        if (sessionInfo) {
          setSessionTitle(sessionInfo.title || `세션 ${new Date(sessionInfo.created_at).toLocaleString()}`);
        } else {
          setSessionTitle(null);
        }
      } catch (e) {
        console.log('[ChatScreen] getSessionInfo error', e);
        setSessionTitle(null);
      }
    }

    loadSessionTitle();
  }, [currentSessionId, isLoggedIn]);

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

  /** ===== 카메라 / 작품 선택 ===== */
  const handleCameraPress = () => {
    if (!exhibitionId) return;
    
    // 과거 전시면 작품 목록 화면으로 이동
    if (isPastExhibition) {
      router.push({ pathname: "/past" as any, params: { exhibitionId: String(exhibitionId) } });
    } else {
      // 현재 전시면 카메라 화면으로 이동
      router.push({ pathname: "/camera", params: { exhibitionId: String(exhibitionId) } });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !exhibitionId) {
      if (!exhibitionId) {
        Alert.alert("알림", "전시를 먼저 선택해주세요.");
      }
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
      exhibitionId,
      artworkId: currentArtworkId,
      artworkTitle: params.artworkTitle,
      artworkImage: params.artworkImage,
    };
  
    addMessage(exhibitionId, userMsg);
    setMessage("");
    setIsLoading(true);
  
    try {
      // 작품이 선택되지 않았으면 artwork_id 없이 전송
      const res = await ChatbotService.askQuestion({
        ...(currentArtworkId && { artwork_id: currentArtworkId }),
        question: userMsg.text,
        age_group: age as any,
        expertise_level: aesthetic as any,
      });
  
      // ✅ 문단 분리 (이전 코드 그대로)
      const paragraphs = res.answer
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
  
      if (paragraphs.length <= 1) {
        addMessage(exhibitionId, {
          id: `bot-${Date.now()}`,
          text: res.answer,
          isUser: false,
          timestamp: new Date(),
          exhibitionId,
          artworkId: currentArtworkId,
        });
      } else {
        const baseTimestamp = Date.now();
  
        paragraphs.forEach((paragraph, index) => {
          setTimeout(() => {
            addMessage(exhibitionId, {
              id: `bot-${baseTimestamp}-${index}`,
              text: paragraph,
              isUser: false,
              timestamp: new Date(baseTimestamp + index * 800),
              exhibitionId,
              artworkId: currentArtworkId,
            });
  
            // ✅ 스크롤 보정
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }, index * 1000);
        });
      }
    } catch (e) {
      addMessage(exhibitionId, {
        id: `error-${Date.now()}`,
        text: "답변 생성 중 오류가 발생했습니다.",
        isUser: false,
        timestamp: new Date(),
        exhibitionId,
        artworkId: currentArtworkId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ===== UI ===== */
  return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* 세션 제목 헤더 (로그인한 사용자만 표시) */}
        {isLoggedIn && exhibitionId && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e5e5",
              backgroundColor: "#fff",
            }}
          >
            <Pressable
              onPress={() => setShowSessions(true)}
              style={{ padding: 4 }}
            >
              <MaterialIcons name="list" size={24} color="#007AFF" />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                {sessionTitle || "새 세션"}
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        )}

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
              {isPastExhibition ? (
                <>
                  <MaterialIcons name="image-search" size={48} color="#007AFF" />
                  <Text style={{ marginTop: 12 }}>작품을 검색해주세요</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="camera-alt" size={48} color="#007AFF" />
                  <Text style={{ marginTop: 12 }}>작품을 촬영해주세요</Text>
                </>
              )}
            </View>
          )
        )}

        {/* 입력 */}
        <ChatInput
          message={message}
          onChangeText={setMessage}
          onSend={handleSendMessage}
          onCameraPress={handleCameraPress}
          exhibitionId={exhibitionId}
          isLoading={isLoading}
          isPastExhibition={isPastExhibition}
          placeholder={
            !exhibitionId 
              ? "전시를 선택해주세요"
              : isPastExhibition
              ? "작품을 검색하거나 질문해보세요"
              : "작품을 촬영하거나 질문해보세요"
          }
        />
        <SessionListModal
          // Only allow the modal to be visible when an exhibition is selected.
          visible={showSessions && !!exhibitionId}
          exhibitionId={exhibitionId}
          onClose={() => setShowSessions(false)}
          onSelectSession={async (sessionId) => {
            try {
              setShowSessions(false);
              if (!exhibitionId) return;
              
              // 같은 전시 내 세션 변경 시 현재 세션 자동 저장 (로그인 사용자만)
              const prevSessionId = currentSessionId;
              const currentMessages = messages;
              
              if (user && prevSessionId && currentMessages.length > 0 && prevSessionId !== sessionId) {
                try {
                  // 현재 세션 자동 저장 (백그라운드)
                  const exhibitionName = exhibitions.find(e => e.id === exhibitionId)?.name || "알 수 없는 전시";
                  await ChatDatabaseService.saveFullHistory(
                    user.id,
                    exhibitionId,
                    currentMessages,
                    sessionTitle || exhibitionName,
                    prevSessionId,
                    age ?? null,
                    aesthetic ?? null
                  );
                  console.log('[ChatScreen] auto-saved session', prevSessionId);
                } catch (e) {
                  console.log('[ChatScreen] auto-save session error', e);
                  // 자동 저장 실패해도 계속 진행
                }
              }
              
              const rows = await ChatDatabaseService.loadSessionMessages(sessionId);
              // Replace local history with loaded messages so UI shows them as a real chat
              setChatHistory(exhibitionId, rows);
              useChatStore.getState().setCurrentSessionId(sessionId);
              // 세션 제목 로드
              const sessionInfo = await ChatDatabaseService.getSessionInfo(sessionId);
              if (sessionInfo) {
                setSessionTitle(sessionInfo.title || `세션 ${new Date(sessionInfo.created_at).toLocaleString()}`);
              }
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
            // 새 세션 생성 시 제목 초기화
            setSessionTitle(null);
          }}
        />
      </View>
  );
}