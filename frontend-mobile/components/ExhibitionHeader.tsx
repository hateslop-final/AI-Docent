import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useState, useEffect, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState<"gallery" | "exhibition">("gallery");
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(galleryId ?? null);
  const [showList, setShowList] = useState(false);
  const [isLoadingExhibitions, setIsLoadingExhibitions] = useState(false);

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
          if (data.length > 0) setActiveTab("exhibition");
        })
        .catch(console.error)
        .finally(() => setIsLoadingExhibitions(false));
    } else {
      setExhibitions([]);
    }
  }, [selectedGalleryId]);

  const isExhibitionValid = useMemo(() => {
    if (!exhibitionId) return false;
    return exhibitions.some((e) => e.id === exhibitionId);
  }, [exhibitions, exhibitionId]);

  /** ===== 실제 선택 반영 로직 (함수 분리) ===== */
  const confirmSelection = (type: "gallery" | "exhibition", id: number) => {
    if (type === "gallery") {
      setExhibition(undefined);
      useChatStore.getState().setCurrentSessionId(null);
      useChatStore.getState().clearAllChatHistories();
      setSelectedGalleryId(id);
      setGallery(id);
      setShowList(false); // 갤러리 선택 시 닫기
    } else {
      setExhibition(id); 
      setShowList(false); // 전시 선택 시 닫기
    }
  };

  /** ===== 변경 시도 로직 ===== */
  const handleAttemptChange = (type: "gallery" | "exhibition", id: number) => {
    const hasHistoryNow = computeHasChatHistoryNow();
    console.log('[ExhibitionHeader] handleAttemptChange user=', user, 'hasHistoryNow=', hasHistoryNow, 'type=', type, 'id=', id);
    const currentMessages = exhibitionId ? getChatHistory(exhibitionId)?.messages || [] : [];
  
    // 현재 전시의 이름을 찾기 (저장 시 title로 사용) 이부부은 ai사용 제목 생성해도 될 듯
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
              // For guest users: when they choose to 'just change', remove ALL
              // locally stored chat data so the app starts fresh for the new
              // selection. This enforces the policy: non-logged-in users lose
              // previous history when they opt to change.
              useChatStore.getState().clearAllChatHistories();
              // Reset current exhibition selection before applying the new one
              // to avoid race conditions between clearing and welcome effects.
              setExhibition(undefined);
              confirmSelection(type, id);
            },
          },
          {
            text: "로그인하기",
            // Do NOT apply the new selection yet — navigate to login first.
            // If we applied the selection here (setExhibition) the chat
            // component would see an exhibition change while the user is
            // still a guest and clear the previous history. That causes the
            // surprising "store reset" behavior when simply navigating to
            // the login page. Defer applying the selection until after the
            // user actually logs in (or they can re-select after login).
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
                  // 로컬은 DB에 이미 저장되었으므로 삭제해도 됨(요청사항).
                  // 세션은 서버에서 다시 불러올 수 있도록 로컬 히스토리를 모두 제거합니다.
                  useChatStore.getState().clearAllChatHistories();
                  useChatStore.getState().setCurrentSessionId(null);
                }
                confirmSelection(type, id);
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
              // 🔥 핵심: 로컬 세션 완전 종료
              useChatStore.getState().clearAllChatHistories();
              useChatStore.getState().setCurrentSessionId(null);

              confirmSelection(type, id);
            }
          },
          { text: "취소", style: "cancel" }
        ]
      );
      return;
    }

    /** Case C: 기록이 없거나 기타 상황 */
    confirmSelection(type, id);
  };


  const headerTitle = isExhibitionValid
    ? exhibitions.find((e) => e.id === exhibitionId)?.name
    : galleries.find((g) => g.id === galleryId)?.name ?? "전시 선택";

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
        <Pressable
          onPress={() => setShowList((v) => !v)}
          style={{ flexDirection: "row", justifyContent: "space-between", padding: 16 }}
        >
          <View>
            <Text style={{ fontSize: 12, color: "#666" }}>전시 / 갤러리 선택</Text>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{headerTitle}</Text>
          </View>
          <Text>{showList ? "▲" : "▼"}</Text>
        </Pressable>

        {showList && (
          <View>
            <View style={{ flexDirection: "row" }}>
              <Pressable
                onPress={() => setActiveTab("gallery")}
                style={{ flex: 1, padding: 12, borderBottomWidth: 2, borderColor: activeTab === "gallery" ? "#007AFF" : "transparent" }}
              >
                <Text style={{ textAlign: "center" }}>갤러리</Text>
              </Pressable>
              <Pressable
                onPress={() => exhibitions.length > 0 && setActiveTab("exhibition")}
                style={{ flex: 1, padding: 12, borderBottomWidth: 2, borderColor: activeTab === "exhibition" ? "#007AFF" : "transparent", opacity: exhibitions.length > 0 ? 1 : 0.4 }}
              >
                <Text style={{ textAlign: "center" }}>{isLoadingExhibitions ? "로딩 중..." : "전시"}</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 250 }}>
              {activeTab === "gallery"
                ? galleries.map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => handleAttemptChange("gallery", g.id)}
                      style={{ padding: 16, backgroundColor: selectedGalleryId === g.id ? "#f0f7ff" : "#fff" }}
                    >
                      <Text>{g.name}</Text>
                    </Pressable>
                  ))
                : exhibitions.map((e) => (
                    <Pressable
                      key={e.id}
                      onPress={() => handleAttemptChange("exhibition", e.id)}
                      style={{ padding: 16, backgroundColor: exhibitionId === e.id ? "#f0f7ff" : "#fff" }}
                    >
                      <Text>{e.name}</Text>
                    </Pressable>
                  ))}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}