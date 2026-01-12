import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useState, useEffect, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router"; 

import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuth } from "@/store/auth.store";
import { useChatStore} from "@/store/chat.store";
import { fetchGalleries, Gallery } from "@/services/gallery";
import { fetchExhibitions, Exhibition } from "@/services/exhibition";
import { ChatDatabaseService } from "@/services/chathistory_service";

export default function ExhibitionHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuth((s) => s.user);

  /** ===== 글로벌 상태 ===== */
  const galleryId = useOnboardingStore((s) => s.gallery);
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  const setGallery = useOnboardingStore((s) => s.setGallery);
  const setExhibition = useOnboardingStore((s) => s.setExhibition);
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);

  const getChatHistory = useChatStore((s) => s.getChatHistory);
  const clearChatHistory = useChatStore((s) => s.clearChatHistory);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const setCurrentSessionId = useChatStore((s) => s.setCurrentSessionId);
  // NOTE: compute chat-history presence at press-time to avoid stale memoization.
  // Some navigation/state timings previously caused `hasChatHistory` to be
  // out-of-date when the user tapped a different gallery/exhibition.
  const computeHasChatHistoryNow = () => {
    if (exhibitionId === undefined) return false;
    const h = useChatStore.getState().getChatHistory(exhibitionId);
    return (h?.messages.length ?? 0) > 0;
  };

  /** ===== 로컬 상태 ===== */
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(galleryId ?? null);
  const [showList, setShowList] = useState(false);
  const [isLoadingExhibitions, setIsLoadingExhibitions] = useState(false);
  
  // 채팅 화면에서는 변경 불가
  const isChatScreen = pathname?.includes("/chat");

  useEffect(() => {
    fetchGalleries().then(setGalleries).catch(console.error);
  }, []);

  useEffect(() => {
    if (galleryId !== undefined && galleryId !== selectedGalleryId) {
      setSelectedGalleryId(galleryId);
    }
  }, [galleryId]);

  useEffect(() => {
    if (selectedGalleryId !== null) {
      setIsLoadingExhibitions(true);
      fetchExhibitions(selectedGalleryId)
        .then((data) => {
          setExhibitions(data);
        })
        .catch(console.error)
        .finally(() => setIsLoadingExhibitions(false));
    } else {
      setExhibitions([]);
    }
  }, [selectedGalleryId]);
  
  // 현재 전시 정보 가져오기 (표시용)
  const currentExhibition = useMemo(() => {
    if (!exhibitionId || !exhibitions.length) return null;
    return exhibitions.find((e) => e.id === exhibitionId) || null;
  }, [exhibitionId, exhibitions]);

  const isExhibitionValid = useMemo(() => {
    if (!exhibitionId) return false;
    return exhibitions.some((e) => e.id === exhibitionId);
  }, [exhibitions, exhibitionId]);

  /** ===== 세션 변경 감지 및 자동 저장 ===== */
  const prevSessionIdRef = useRef<number | null>(currentSessionId);
  
  useEffect(() => {
    const prevSessionId = prevSessionIdRef.current;
    const currentSessionId = useChatStore.getState().currentSessionId;
    
    console.log('[ExhibitionHeader] session change check:', {
      prevSessionId,
      currentSessionId,
      hasUser: !!user,
      exhibitionId,
      willSave: user && exhibitionId && prevSessionId !== null && prevSessionId !== currentSessionId && prevSessionId !== undefined
    });
    
    // 세션이 변경되었고, 이전 세션이 있고, 로그인한 사용자인 경우 자동 저장
    if (
      user &&
      exhibitionId &&
      prevSessionId !== null &&
      prevSessionId !== currentSessionId &&
      prevSessionId !== undefined
    ) {
      const currentMessages = getChatHistory(exhibitionId)?.messages || [];
      console.log('[ExhibitionHeader] saving session on change:', {
        prevSessionId,
        currentSessionId,
        messageCount: currentMessages.length
      });
      
      if (currentMessages.length > 0) {
        const exhibitionName = exhibitions.find(e => e.id === exhibitionId)?.name || "알 수 없는 전시";
        
        (async () => {
          try {
            await ChatDatabaseService.saveFullHistory(
              user.id,
              exhibitionId,
              currentMessages,
              exhibitionName,
              prevSessionId,
              age ?? null,
              aesthetic ?? null
            );
            console.log('[ExhibitionHeader] ✅ auto-saved session on session change', prevSessionId);
            // 로컬 초기화는 chat.tsx에서 새 세션 메시지 로드 후 처리
          } catch (e) {
            console.error('[ExhibitionHeader] ❌ auto-save session error:', e);
            // 저장 실패해도 계속 진행
          }
        })();
      }
    }
    
    prevSessionIdRef.current = currentSessionId;
  }, [currentSessionId, user, exhibitionId, age, aesthetic, getChatHistory, exhibitions, clearChatHistory]);

  /** ===== 전시 변경 감지 및 저장 여부 확인 ===== */
  const prevExhibitionIdRef = useRef<number | undefined>(exhibitionId);
  const isProcessingChangeRef = useRef(false);

  useEffect(() => {
    if (isProcessingChangeRef.current) return;

    const prevId = prevExhibitionIdRef.current;
    const currentId = exhibitionId;

    if (prevId !== undefined && prevId !== currentId) {
      const hasHistoryNow = (() => {
        const h = useChatStore.getState().getChatHistory(prevId);
        return (h?.messages.length ?? 0) > 0;
      })();

      if (hasHistoryNow && user) {
        // 로그인한 사용자는 자동 저장
        isProcessingChangeRef.current = true;
        const currentMessages = getChatHistory(prevId)?.messages || [];
        const currentExhibitionName = exhibitions.find(e => e.id === prevId)?.name || "알 수 없는 전시";

        (async () => {
          try {
            await ChatDatabaseService.saveFullHistory(
              user.id,
              prevId,
              currentMessages,
              currentExhibitionName,
              currentSessionId,
              age ?? null,
              aesthetic ?? null
            );
            console.log('[ExhibitionHeader] auto-saved session on exhibition change', prevId);
          } catch (e) {
            console.error('[ExhibitionHeader] auto-save error:', e);
            // 저장 실패해도 계속 진행
          } finally {
            useChatStore.getState().clearAllChatHistories();
            useChatStore.getState().setCurrentSessionId(null);
            isProcessingChangeRef.current = false;
            prevExhibitionIdRef.current = currentId;
          }
        })();
        return;
      } else if (hasHistoryNow && !user) {
        // 비로그인 사용자는 저장 여부 확인
        isProcessingChangeRef.current = true;
        // prevExhibitionIdRef를 먼저 업데이트하여 재실행 방지
        prevExhibitionIdRef.current = currentId;
        
        // 즉시 Alert 표시
        Alert.alert(
          "기록 저장",
          "지금까지의 대화 내용을 저장하시겠습니까?",
          [
            {
              text: "로그인하여 저장",
              onPress: () => {
                // 즉시 상태 업데이트
                prevExhibitionIdRef.current = prevId;
                isProcessingChangeRef.current = false;
                setExhibition(prevId);
                // 라우팅은 약간의 지연 후
                requestAnimationFrame(() => {
                  router.push("/mypage");
                });
              }
            },
            {
              text: "저장 안 함",
              style: "destructive",
              onPress: () => {
                // 즉시 상태 업데이트 및 세션 초기화
                prevExhibitionIdRef.current = currentId;
                isProcessingChangeRef.current = false;
                useChatStore.getState().clearAllChatHistories();
                useChatStore.getState().setCurrentSessionId(null);
              }
            },
            {
              text: "취소",
              style: "cancel",
              onPress: () => {
                // Alert는 자동으로 닫히므로 상태만 업데이트
                prevExhibitionIdRef.current = prevId;
                isProcessingChangeRef.current = false;
                // setExhibition은 다음 틱에 실행하여 Alert가 먼저 닫히도록 함
                setTimeout(() => {
                  setExhibition(prevId);
                }, 100);
              }
            }
          ],
          {
            cancelable: true,
            onDismiss: () => {
              // Alert가 외부에서 닫힌 경우 (예: 뒤로가기)
              prevExhibitionIdRef.current = prevId;
              isProcessingChangeRef.current = false;
              setExhibition(prevId);
            }
          }
        );
        return;
      } else if (!hasHistoryNow) {
        // 기록이 없어도 세션 ID는 초기화
        useChatStore.getState().setCurrentSessionId(null);
        prevExhibitionIdRef.current = currentId;
        return;
      }
    }
    prevExhibitionIdRef.current = currentId;
  }, [exhibitionId, user, age, aesthetic, getChatHistory, currentSessionId, exhibitions, setExhibition]);

  /** ===== 실제 선택 반영 로직 (함수 분리) ===== */
  const confirmSelection = (id: number) => {
    // 갤러리만 선택 가능
      setExhibition(undefined);
      useChatStore.getState().setCurrentSessionId(null);
      useChatStore.getState().clearAllChatHistories();
      setSelectedGalleryId(id);
      setGallery(id);
    setShowList(false);
  };

  /** ===== 변경 시도 로직 ===== */
  const handleAttemptChange = async (id: number) => {
    // 채팅 화면에서는 변경 불가
    if (isChatScreen) {
      return;
    }
    
    const hasHistoryNow = computeHasChatHistoryNow();
    console.log('[ExhibitionHeader] handleAttemptChange user=', user, 'hasHistoryNow=', hasHistoryNow, 'id=', id);
    const currentMessages = exhibitionId ? getChatHistory(exhibitionId)?.messages || [] : [];
  
    // 현재 전시의 이름을 찾기 (저장 시 title로 사용)
    const currentExhibitionName = exhibitions.find(e => e.id === exhibitionId)?.name || "알 수 없는 전시";
    
    // 비로그인 사용자이고 기록이 있으면 저장 여부 확인
    if (!user && hasHistoryNow && exhibitionId) {
      Alert.alert(
        "기록 저장",
        "지금까지의 대화 내용을 저장하시겠습니까?",
        [
          {
            text: "로그인하여 저장",
            onPress: () => {
              setShowList(false);
              router.push("/mypage");
            }
          },
          {
            text: "저장 안 함",
            style: "destructive",
            onPress: () => {
              useChatStore.getState().clearAllChatHistories();
              useChatStore.getState().setCurrentSessionId(null);
              confirmSelection(id);
            }
          },
          {
            text: "취소",
            style: "cancel",
            onPress: () => {
              setShowList(false);
            }
          }
        ]
      );
      return;
    }
    
    // 로그인한 사용자이고 기록이 있으면 자동 저장
    if (user && hasHistoryNow && exhibitionId) {
      try {
        await ChatDatabaseService.saveFullHistory(
          user.id,
          exhibitionId,
          currentMessages,
          currentExhibitionName,
          currentSessionId,
          age ?? null,
          aesthetic ?? null
        );
        console.log('[ExhibitionHeader] auto-saved session on gallery change', exhibitionId);
      } catch (e) {
        console.error('[ExhibitionHeader] auto-save error:', e);
        // 저장 실패해도 계속 진행
      }
    }
    
    // 히스토리 정리 후 변경
    useChatStore.getState().clearAllChatHistories();
    useChatStore.getState().setCurrentSessionId(null);
    confirmSelection(id);
  };


  const headerTitle = galleries.find((g) => g.id === galleryId)?.name ?? "갤러리 선택";

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
        <Pressable
          onPress={() => !isChatScreen && setShowList((v) => !v)}
          style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            padding: 16,
            opacity: isChatScreen ? 0.6 : 1,
          }}
          disabled={isChatScreen}
        >
          <View>
            <Text
              style={{
                fontSize: 12,
                color: "#666",
              }}
            >
              현재 갤러리
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111",
              }}
            >
              {galleries.find((g) => g.id === galleryId)?.name ?? "갤러리 선택"}
            </Text>

            {/* 현재 전시 표시 (읽기 전용) */}
            {currentExhibition && (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#666",
                  marginTop: 2,
                }}
              >
                {currentExhibition.name}
              </Text>
            )}
          </View>
          {!isChatScreen && <Text>{showList ? "▲" : "▼"}</Text>}
        </Pressable>

        {showList && !isChatScreen && (
          <View>
            <ScrollView style={{ maxHeight: 250 }}>
              {galleries.map((g) => (
                    <Pressable
                      key={g.id}
                  onPress={() => handleAttemptChange(g.id)}
                      style={{ padding: 16, backgroundColor: selectedGalleryId === g.id ? "#f0f7ff" : "#fff" }}
                    >
                      <Text>{g.name}</Text>
                    </Pressable>
                  ))}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}