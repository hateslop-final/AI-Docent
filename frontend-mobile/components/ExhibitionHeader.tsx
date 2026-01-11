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

  /** ===== 실제 선택 반영 로직 (함수 분리) ===== */
  const confirmGallerySelection = (id: number) => {
    // 갤러리 선택 시 전시 초기화
    setExhibition(undefined);
    useChatStore.getState().setCurrentSessionId(null);
    useChatStore.getState().clearAllChatHistories();
    setSelectedGalleryId(id);
    setGallery(id);
    setShowList(false);
  };

  const confirmExhibitionSelection = (id: number) => {
    // 전시 선택 시
    setExhibition(id);
  };

  /** ===== 전시 변경 처리 (홈 탭에서 전시 변경 시) ===== */
  const prevExhibitionIdRef = useRef<number | undefined>(exhibitionId);
  const isProcessingChangeRef = useRef(false);
  
  useEffect(() => {
    // 이미 처리 중이면 무시
    if (isProcessingChangeRef.current) return;
    
    const prevId = prevExhibitionIdRef.current;
    const currentId = exhibitionId;
    
    // 전시가 변경되었고, 이전 전시가 있었을 때만 확인
    if (prevId !== undefined && prevId !== currentId) {
      const hasHistoryNow = (() => {
        const h = useChatStore.getState().getChatHistory(prevId);
        return (h?.messages.length ?? 0) > 0;
      })();
      
      if (hasHistoryNow) {
        isProcessingChangeRef.current = true;
        const currentMessages = getChatHistory(prevId)?.messages || [];
        const currentExhibitionName = exhibitions.find(e => e.id === prevId)?.name || "알 수 없는 전시";
        
        if (!user) {
          Alert.alert(
            "기록 저장 안내",
            "로그인을 하시면 채팅 기록을 저장하실 수 있습니다.",
            [
              {
                text: "그냥 변경",
                style: "destructive",
                onPress: () => {
                  useChatStore.getState().clearAllChatHistories();
                  useChatStore.getState().setCurrentSessionId(null);
                  isProcessingChangeRef.current = false;
                  prevExhibitionIdRef.current = currentId;
                },
              },
              {
                text: "로그인하기",
                onPress: () => {
                  // 전시 변경 취소
                  setExhibition(prevId);
                  isProcessingChangeRef.current = false;
                  router.push("/mypage");
                },
              },
              { 
                text: "취소", 
                style: "cancel",
                onPress: () => {
                  // 전시 변경 취소
                  setExhibition(prevId);
                  isProcessingChangeRef.current = false;
                }
              }
            ]
          );
          return;
        }
        
        if (user) {
          // 전시 내 모든 세션 일괄 저장 여부 확인
          Alert.alert(
            "기록 저장",
            "이 전시의 모든 대화 내용을 저장하시겠습니까?",
            [
              {
                text: "저장 후 변경",
                onPress: async () => {
                  try {
                    // 현재 세션 저장
                    await ChatDatabaseService.saveFullHistory(
                      user.id,
                      prevId,
                      currentMessages,
                      currentExhibitionName,
                      currentSessionId,
                      age ?? null,
                      aesthetic ?? null
                    );
                    useChatStore.getState().clearAllChatHistories();
                    useChatStore.getState().setCurrentSessionId(null);
                    isProcessingChangeRef.current = false;
                    prevExhibitionIdRef.current = currentId;
                  } catch (e) {
                    console.error("저장 실패:", e);
                    Alert.alert("오류", "기록 저장 중 문제가 발생했습니다.");
                    // 저장 실패 시 전시 변경 취소
                    setExhibition(prevId);
                    isProcessingChangeRef.current = false;
                  }
                }
              },
              {
                text: "저장 안 함",
                style: "destructive",
                onPress: () => {
                  useChatStore.getState().clearAllChatHistories();
                  useChatStore.getState().setCurrentSessionId(null);
                  isProcessingChangeRef.current = false;
                  prevExhibitionIdRef.current = currentId;
                }
              },
              { 
                text: "취소", 
                style: "cancel",
                onPress: () => {
                  // 전시 변경 취소
                  setExhibition(prevId);
                  isProcessingChangeRef.current = false;
                }
              }
            ]
          );
          return;
        }
      } else {
        // 기록이 없으면 바로 업데이트
        prevExhibitionIdRef.current = currentId;
      }
    } else {
      // 전시가 변경되지 않았으면 ref만 업데이트
      prevExhibitionIdRef.current = currentId;
    }
  }, [exhibitionId, user, exhibitions, getChatHistory, currentSessionId, age, aesthetic, router]);

  /** ===== 갤러리 변경 시도 로직 ===== */
  const handleAttemptChange = (id: number) => {
    // 채팅 화면에서는 변경 불가
    if (isChatScreen) {
      return;
    }
    
    const hasHistoryNow = computeHasChatHistoryNow();
    console.log('[ExhibitionHeader] handleAttemptChange user=', user, 'hasHistoryNow=', hasHistoryNow, 'id=', id);
    const currentMessages = exhibitionId ? getChatHistory(exhibitionId)?.messages || [] : [];
  
    // 현재 전시의 이름을 찾기 (저장 시 title로 사용)
    const currentExhibitionName = exhibitions.find(e => e.id === exhibitionId)?.name || "알 수 없는 전시";
    if (!user && hasHistoryNow) {
      Alert.alert(
        "기록 저장 안내",
        "로그인을 하시면 채팅 기록을 저장하실 수 있습니다.",
        [
          {
            text: "그냥 변경",
            style: "destructive",
            onPress: () => {
              useChatStore.getState().clearAllChatHistories();
              setExhibition(undefined);
              confirmGallerySelection(id);
            },
          },
          {
            text: "로그인하기",
            onPress: () => {
              setShowList(false);
              router.push("/mypage");
            },
          },
          { text: "취소", style: "cancel" }
        ]
      );
      return;
    } 
    if (user && hasHistoryNow) {
      Alert.alert(
        "기록 저장",
        "지금까지의 대화 내용을 저장하시겠습니까?",
        [
          {
            text: "저장 후 변경",
            onPress: async () => {
              try {
                if (exhibitionId) {
                  await ChatDatabaseService.saveFullHistory(
                    user.id,
                    exhibitionId,
                    currentMessages,
                    currentExhibitionName,
                    currentSessionId,
                    age ?? null,
                    aesthetic ?? null
                  );
                  useChatStore.getState().clearAllChatHistories();
                  useChatStore.getState().setCurrentSessionId(null);
                }
                confirmGallerySelection(id);
              } catch (e) {
                console.error("저장 실패:", e);
                Alert.alert("오류", "기록 저장 중 문제가 발생했습니다.");
              }
            }
          },
          {
            text: "저장 안 함",
            style: "destructive",
            onPress: () => {
              useChatStore.getState().clearAllChatHistories();
              useChatStore.getState().setCurrentSessionId(null);
              confirmGallerySelection(id);
            }
          },
          { text: "취소", style: "cancel" }
        ]
      );
      return;
    }

    /** Case C: 기록이 없거나 기타 상황 */
    confirmGallerySelection(id);
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