import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useOnboardingStore } from "../../store/onboarding.store";
import { fetchExhibitions, Exhibition } from "@/services/exhibition";
import { fetchGalleries, Gallery } from "@/services/gallery";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function HomeScreen() {
  const router = useRouter();
  const galleryId = useOnboardingStore((s) => s.gallery);
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadExhibitionData() {
      if (!galleryId || !exhibitionId) {
        setExhibition(null);
        setGallery(null);
        return;
      }

      try {
        setLoading(true);
        const [galleries, exhibitions] = await Promise.all([
          fetchGalleries(),
          fetchExhibitions(galleryId),
        ]);

        const selectedGallery = galleries.find((g) => g.id === galleryId);
        const selectedExhibition = exhibitions.find((e) => e.id === exhibitionId);

        setGallery(selectedGallery || null);
        setExhibition(selectedExhibition || null);
      } catch (err) {
        console.error("Failed to load exhibition data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadExhibitionData();
  }, [galleryId, exhibitionId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 120, // FloatingTabBar를 위한 여백
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {exhibition && gallery ? (
          /* 전시 상세 카드 */
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                borderWidth: 1,
                borderColor: "#f0f0f0",
              }}
            >
              {/* 갤러리 정보 */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  갤러리
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>
                  {gallery.name}
                </Text>
              </View>

              {/* 전시 제목 */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#000", marginBottom: 8 }}>
                  {exhibition.name}
                </Text>
              </View>

              {/* 전시 설명 */}
              {exhibition.description && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, color: "#4b5563", lineHeight: 22 }}>
                    {exhibition.description}
                  </Text>
                </View>
              )}

              {/* 전시 기간 */}
              {(exhibition.start_date || exhibition.end_date) && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <MaterialIcons name="event" size={18} color="#666" />
                  <Text style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>
                    {exhibition.start_date && exhibition.end_date
                      ? `${formatDate(exhibition.start_date)} - ${formatDate(exhibition.end_date)}`
                      : exhibition.start_date
                      ? `${formatDate(exhibition.start_date)}부터`
                      : exhibition.end_date
                      ? `${formatDate(exhibition.end_date)}까지`
                      : ""}
                  </Text>
                </View>
              )}

              {/* 액션 버튼들 */}
              <View style={{ marginTop: 20, gap: 12 }}>
                <Pressable
                  style={{
                    backgroundColor: "#000",
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => router.push("/(tabs)/chat")}
                >
                  <MaterialIcons name="chat" size={20} color="#fff" />
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    AI에게 질문하기
                  </Text>
                </Pressable>

                <Pressable
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => router.push("/camera")}
                >
                  <MaterialIcons name="camera-alt" size={20} color="#1f2937" />
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 16,
                      color: "#1f2937",
                      marginLeft: 8,
                    }}
                  >
                    작품 사진으로 질문하기
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          /* AI 도슨트 인사 (전시 미선택 시) */
          <>
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 12 }}>
                AI 도슨트
              </Text>
              <Text style={{ color: "#4b5563", lineHeight: 22 }}>
                전시를 보며 궁금한 점이 생기면{"\n"}
                작품, 작가, 배경까지 모두 질문해보세요.
              </Text>
            </View>

            {/* 메인 액션 */}
            <View style={{ gap: 16 }}>
              <Pressable
                style={{
                  backgroundColor: "#000",
                  paddingVertical: 16,
                  borderRadius: 16,
                }}
                onPress={() => router.push("/(tabs)/chat")}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  AI에게 질문하기
                </Text>
              </Pressable>

              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  paddingVertical: 16,
                  borderRadius: 16,
                }}
                onPress={() => router.push("/camera")}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    color: "#1f2937",
                  }}
                >
                  작품 사진으로 질문하기
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}