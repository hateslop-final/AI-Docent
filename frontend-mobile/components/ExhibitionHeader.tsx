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
                  setExhibition(prevId); // Revert selection
                  isProcessingChangeRef.current = false;
                  router.push("/mypage");
                },
              },
              {
                text: "취소",
                style: "cancel",
                onPress: () => {
                  setExhibition(prevId); // Revert selection
                  isProcessingChangeRef.current = false;
                }
              }
            ]
          );
          return;
        }

        if (user) {
          Alert.alert(
            "기록 저장",
            "이 전시의 모든 대화 내용을 저장하시겠습니까?",
            [
              {
                text: "저장 후 변경",
                onPress: async () => {
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
                    useChatStore.getState().clearAllChatHistories();
                    useChatStore.getState().setCurrentSessionId(null);
                    isProcessingChangeRef.current = false;
                    prevExhibitionIdRef.current = currentId;
                  } catch (e) {
                    console.error("저장 실패:", e);
                    Alert.alert("오류", "기록 저장 중 문제가 발생했습니다.");
                    setExhibition(prevId); // Revert selection
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
                  setExhibition(prevId); // Revert selection
                  isProcessingChangeRef.current = false;
                }
              }
            ]
          );
          return;
        }
      }
    }
    prevExhibitionIdRef.current = currentId;
  }, [exhibitionId, user, age, aesthetic, router, getChatHistory, currentSessionId, exhibitions, setExhibition]);

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
              confirmSelection(id);
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
                confirmSelection(id);
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
              confirmSelection(id);
            }
          },
          { text: "취소", style: "cancel" }
        ]
      );
      return;
    }

    /** Case C: 기록이 없거나 기타 상황 */
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