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
  // 🔒 컴포넌트 재마운트에도 유지되는 전역 Alert 락

let globalExhibitionAlertLock = false;
let globalSessionCreationLock = false; // 세션 생성 중복 방지
export default function ExhibitionHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const alertCountRef = useRef(0);
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
    
    // 세션이 변경되었고, 이전 세션이 있고, 로그인한 사용자인 경우 자동 저장 및 초기화
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
      
      (async () => {
        try {
          // 1. 로컬 세션 메시지들을 DB에 저장
          if (currentMessages.length > 0) {
            const exhibitionName = exhibitions.find(e => e.id === exhibitionId)?.name || "알 수 없는 전시";
            await ChatDatabaseService.saveOnSessionChange(
              user.id,
              exhibitionId,
              currentMessages,
              exhibitionName,
              prevSessionId,
              age ?? null,
              aesthetic ?? null
            );
          }
        } catch (e) {
          console.error('[ExhibitionHeader] ❌ auto-save session error:', e);
          // 저장 실패해도 계속 진행
        } finally {
          // 2. 로컬 히스토리 초기화
          useChatStore.getState().clearAllChatHistories();
          
          // 3. 새 세션이 이미 생성된 경우 (onCreateNew에서 생성한 경우)
          // currentSessionId가 이미 설정되어 있으므로 그대로 사용
          // 새 세션이 없는 경우는 chat.tsx에서 처리
        }
      })();
    }
    
    prevSessionIdRef.current = currentSessionId;
  }, [currentSessionId, user, exhibitionId, age, aesthetic, getChatHistory, exhibitions, clearChatHistory]);

  /** ===== 전시 변경 감지 및 저장 여부 확인 ===== */
const prevExhibitionIdRef = useRef<number | undefined>(exhibitionId);
const isProcessingChangeRef = useRef(false);

useEffect(() => {
  // 🔒 처리 중이면 재진입 차단
  if (isProcessingChangeRef.current) {
    console.log('[EFFECT SKIP] processing');
    return;
  }

  const prevId = prevExhibitionIdRef.current;
  const currentId = exhibitionId;

  if (prevId !== undefined && prevId !== currentId) {
    const hasHistoryNow = (() => {
      const h = useChatStore.getState().getChatHistory(prevId);
      return (h?.messages.length ?? 0) > 0;
    })();

    /* ================= 로그인 사용자 ================= */
    if (hasHistoryNow && user) {
      isProcessingChangeRef.current = true;

      const currentMessages = getChatHistory(prevId)?.messages || [];
      const currentExhibitionName =
        exhibitions.find(e => e.id === prevId)?.name || "알 수 없는 전시";

      (async () => {
        try {
          // 1. 현재 세션 메시지들을 DB에 저장
          await ChatDatabaseService.saveOnExhibitionChange(
            user.id,
            prevId,
            currentMessages,
            currentExhibitionName,
            currentSessionId,
            age ?? null,
            aesthetic ?? null
          );
        } catch (e) {
          console.error('[ExhibitionHeader] auto-save error:', e);
        } finally {
          // 2. 로컬 히스토리 삭제
          useChatStore.getState().clearAllChatHistories();
          useChatStore.getState().setCurrentSessionId(null);

          // 3. 새 전시에 기존 세션이 있는지 확인
          if (currentId !== undefined && !globalSessionCreationLock) {
            try {
              const existingSessions = await ChatDatabaseService.listSessions(user.id, currentId);
              console.log('[ExhibitionHeader] 🔵 전시 변경 후 기존 세션 확인:', {
                exhibitionId: currentId,
                sessionCount: existingSessions.length,
                sessions: existingSessions.map(s => ({ id: s.id, title: s.title }))
              });

              if (existingSessions.length > 0) {
                // 기존 세션이 있으면 세션 모달 열기
                console.log('[ExhibitionHeader] ✅ 기존 세션 존재 - 세션 모달 열기 요청');
                useChatStore.getState().openSessionModal();
              } else {
                // 기존 세션이 없으면 로컬에서만 초기화 (DB에 세션 생성하지 않음)
                // 실제로 메시지를 보낼 때 세션이 생성됨
                console.log('[ExhibitionHeader] 🔵 기존 세션 없음 - 로컬만 초기화 (DB 세션 생성 안 함)');
                useChatStore.getState().setCurrentSessionId(null);
              }
            } catch (e) {
              console.error('[ExhibitionHeader] ❌ 세션 목록 확인 실패:', e);
              // 실패 시에도 로컬만 초기화 (DB에 세션 생성하지 않음)
              console.log('[ExhibitionHeader] 🔵 세션 목록 확인 실패 - 로컬만 초기화 (DB 세션 생성 안 함)');
              useChatStore.getState().setCurrentSessionId(null);
            }
          }

          // ✅ 여기서만 확정
          prevExhibitionIdRef.current = currentId;
          isProcessingChangeRef.current = false;
        }
      })();
      return;
    }

    /* ================= 비로그인 사용자 ================= */
    if (hasHistoryNow && !user) {
      // 🔒 전역 Alert 락 (재마운트 방지)
      if (globalExhibitionAlertLock) {
        console.log('[ALERT SKIP] global lock active');
        return;
      }
    
      globalExhibitionAlertLock = true;
      isProcessingChangeRef.current = true;
      alertCountRef.current += 1;
    
      console.log('[ALERT OPEN]', {
        count: alertCountRef.current,
        prevId,
        currentId,
      });
    
      Alert.alert(
        "기록 저장",
        "지금까지의 대화 내용을 저장하시겠습니까?",
        [
          {
            text: "로그인하여 저장",
            onPress: () => {
              console.log('[ALERT PRESS] login');
              globalExhibitionAlertLock = false;
              prevExhibitionIdRef.current = prevId;
              isProcessingChangeRef.current = false;
              setExhibition(prevId);
              requestAnimationFrame(() => {
                router.push("/mypage");
              });
            }
          },
          {
            text: "저장 안 함",
            style: "destructive",
            onPress: () => {
              console.log('[ALERT PRESS] discard');
              globalExhibitionAlertLock = false;
    
              useChatStore.getState().clearAllChatHistories();
              useChatStore.getState().setCurrentSessionId(null);
    
              prevExhibitionIdRef.current = currentId;
              isProcessingChangeRef.current = false;
            }
          },
          {
            text: "취소",
            style: "cancel",
            onPress: () => {
              console.log('[ALERT PRESS] cancel');
              globalExhibitionAlertLock = false;
    
              prevExhibitionIdRef.current = prevId;
              isProcessingChangeRef.current = false;
              setTimeout(() => setExhibition(prevId), 100);
            }
          }
        ],
        {
          cancelable: true,
          onDismiss: () => {
            console.log('[ALERT DISMISS]');
            globalExhibitionAlertLock = false;
    
            prevExhibitionIdRef.current = prevId;
            isProcessingChangeRef.current = false;
            setExhibition(prevId);
          }
        }
      );
      return;
    }

    /* ================= 기록 없음 ================= */
    if (!hasHistoryNow) {
      // 기록이 없으면 DB 저장 없이 로컬만 초기화
      console.log('[ExhibitionHeader] 🔵 기록 없음 - 로컬만 초기화 (DB 세션 생성/저장 안 함)');
      useChatStore.getState().setCurrentSessionId(null);

      // 🔍 새 전시에 기존 세션이 있는지 확인 후 모달 오픈
      if (user && currentId !== undefined) {
        (async () => {
          try {
            const existingSessions = await ChatDatabaseService.listSessions(user.id, currentId);
            console.log('[ExhibitionHeader] 🔵 기록 없음 분기 - 새 전시 기존 세션 확인:', {
              exhibitionId: currentId,
              sessionCount: existingSessions.length,
              sessions: existingSessions.map(s => ({ id: s.id, title: s.title }))
            });
            if (existingSessions.length > 0) {
              console.log('[ExhibitionHeader] ✅ 기존 세션 존재 - 세션 모달 열기 요청 (기록 없음 분기)');
              useChatStore.getState().openSessionModal();
            }
          } catch (e) {
            console.error('[ExhibitionHeader] ❌ 기록 없음 분기 - 세션 목록 확인 실패:', e);
          }
        })();
      }

      prevExhibitionIdRef.current = currentId;
      return;
    }
  }

  prevExhibitionIdRef.current = currentId;
}, [
  exhibitionId,
  user,
  age,
  aesthetic,
  getChatHistory,
  currentSessionId,
  exhibitions,
  setExhibition,
]);
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
    
    // 로그인한 사용자이고 기록이 있으면 저장 및 세션 확인
    if (user && hasHistoryNow && exhibitionId) {
      try {
        // 1. 현재 세션 메시지들을 DB에 저장
        await ChatDatabaseService.saveOnExhibitionChange(
          user.id,
          exhibitionId,
          currentMessages,
          currentExhibitionName,
          currentSessionId,
          age ?? null,
          aesthetic ?? null
        );
      } catch (e) {
        console.error('[ExhibitionHeader] auto-save error:', e);
        // 저장 실패해도 계속 진행
      }
      
      // 2. 로컬 히스토리 삭제
      useChatStore.getState().clearAllChatHistories();
      useChatStore.getState().setCurrentSessionId(null);
      
      // 3. 새 전시에 기존 세션이 있는지 확인
      if (id !== undefined && !globalSessionCreationLock) {
        try {
          const existingSessions = await ChatDatabaseService.listSessions(user.id, id);
          console.log('[ExhibitionHeader] 🔵 handleAttemptChange - 전시 변경 후 기존 세션 확인:', {
            exhibitionId: id,
            sessionCount: existingSessions.length,
            sessions: existingSessions.map(s => ({ id: s.id, title: s.title }))
          });

          if (existingSessions.length > 0) {
            // 기존 세션이 있으면 세션 모달 열기
            console.log('[ExhibitionHeader] ✅ 기존 세션 존재 - 세션 모달 열기 요청');
            useChatStore.getState().openSessionModal();
            // 전시 변경은 confirmSelection에서 처리됨
            confirmSelection(id);
            return;
          } else {
            // 기존 세션이 없으면 로컬에서만 초기화 (DB에 세션 생성하지 않음)
            console.log('[ExhibitionHeader] 🔵 기존 세션 없음 - 로컬만 초기화 (DB 세션 생성 안 함)');
          }
        } catch (e) {
          console.error('[ExhibitionHeader] ❌ 세션 목록 확인 실패:', e);
          // 실패 시에도 로컬만 초기화 (DB에 세션 생성하지 않음)
          console.log('[ExhibitionHeader] 🔵 세션 목록 확인 실패 - 로컬만 초기화 (DB 세션 생성 안 함)');
        }
      }
      
      // 세션이 없거나 확인 실패 시 전시 변경
      confirmSelection(id);
      return;
    }
    
    // 저장은 useEffect에서 처리하므로 여기서는 저장하지 않음
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