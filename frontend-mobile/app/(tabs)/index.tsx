import { ScrollView, View, Text, Pressable, ImageBackground } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useOnboardingStore } from "../../store/onboarding.store";
import { fetchExhibitions, Exhibition } from "@/services/exhibition";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@/components/ThemeProvider";

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const galleryId = useOnboardingStore((s) => s.gallery);
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  const setExhibition = useOnboardingStore((s) => s.setExhibition);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  useEffect(() => {
    async function loadExhibitionData() {
      if (!galleryId) {
        setExhibitions([]);
        return;
      }

      try {
        const exhibitionsData = await fetchExhibitions(galleryId);
        setExhibitions(exhibitionsData || []);
      } catch (err) {
        console.error("Failed to load exhibition data:", err);
      }
    }

    loadExhibitionData();
  }, [galleryId]);

  // 현재 전시와 과거 전시 분리
  const currentExhibitions = useMemo(() => {
    const now = new Date();
    return exhibitions.filter((e) => {
      if (!e.start_date && !e.end_date) return e.is_now === true;
      if (e.end_date) {
        const endDate = new Date(e.end_date);
        return endDate >= now;
      }
      return e.is_now === true;
    });
  }, [exhibitions]);

  const pastExhibitions = useMemo(() => {
    const now = new Date();
    return exhibitions.filter((e) => {
      // show가 false이면 제외
      if (e.show === false) return false;

      if (!e.start_date && !e.end_date) return e.is_now !== true;
      if (e.end_date) {
        const endDate = new Date(e.end_date);
        return endDate < now;
      }
      return e.is_now !== true;
    });
  }, [exhibitions]);

  const displayedExhibitions =
    activeTab === "current" ? currentExhibitions : pastExhibitions;

  const handleExhibitionSelect = (exhId: number) => {
    setExhibition(exhId);
    router.push(`/exhibition/${exhId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!galleryId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* 플로팅 바 위쪽 경계까지만 */}
        <View style={{ flex: 1, marginBottom: 92 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 24,
              paddingBottom: 24,
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            <MaterialIcons name="museum" size={64} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textSecondary,
                marginTop: 16,
              }}
            >
              갤러리를 선택해주세요
            </Text>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* 플로팅 바 위쪽 경계까지만 */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={true}
        >

        {/* 현재/과거 전시 탭 */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 12,
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("current")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "current" ? colors.cardBackground : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: activeTab === "current" ? "600" : "500",
                color: activeTab === "current" ? colors.text : colors.textSecondary,
              }}
            >
              현재 전시 ({currentExhibitions.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("past")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "past" ? colors.cardBackground : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: activeTab === "past" ? "600" : "500",
                color: activeTab === "past" ? colors.text : colors.textSecondary,
              }}
            >
              과거 전시 ({pastExhibitions.length})
            </Text>
          </Pressable>
        </View>

        {/* 전시 그리드 (2x2) */}
        {displayedExhibitions.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {displayedExhibitions.map((exh) => {
              return (
                <Pressable
                  key={exh.id}
                  onPress={() => handleExhibitionSelect(exh.id)}
                  style={{
                    width: "47%",
                    height: 240,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {exh.poster_url ? (
                    <ImageBackground
                      key={`exhibition-${exh.id}-poster`}
                      source={{ uri: exh.poster_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                      resizeMode="cover"
                    >
                      {/* 그라디언트 오버레이 */}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
                        locations={[0, 0.5, 1]}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: "50%",
                        }}
                      />
                      
                      {/* 텍스트 컨테이너 */}
                      <View style={{ padding: 16, zIndex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: "#fff",
                            marginBottom: 6,
                            textShadowColor: "rgba(0, 0, 0, 0.5)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 4,
                          }}
                          numberOfLines={2}
                        >
                          {exh.name}
                        </Text>
                        {(exh.start_date || exh.end_date) && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: "rgba(255, 255, 255, 0.9)",
                              textShadowColor: "rgba(0, 0, 0, 0.5)",
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                            }}
                            numberOfLines={1}
                          >
                            {exh.start_date && exh.end_date
                              ? `${formatDate(exh.start_date)} - ${formatDate(
                                  exh.end_date
                                )}`
                              : exh.start_date
                              ? `${formatDate(exh.start_date)}부터`
                              : exh.end_date
                              ? `${formatDate(exh.end_date)}까지`
                              : ""}
                          </Text>
                        )}
                      </View>
                    </ImageBackground>
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#f0f0f0",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons name="photo" size={48} color="#bbb" />
                      <Text
                        style={{
                          position: "absolute",
                          bottom: 16,
                          left: 16,
                          right: 16,
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#666",
                        }}
                        numberOfLines={2}
                      >
                        {exh.name}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 12 }}>
              {activeTab === "current"
                ? "진행 중인 전시가 없습니다"
                : "과거 전시가 없습니다"}
            </Text>
          </View>
        )}
      </ScrollView>
      </View>
    </View>
  );
}
