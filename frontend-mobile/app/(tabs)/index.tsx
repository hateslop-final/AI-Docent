import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "../../store/onboarding.store";
import { fetchExhibitions, Exhibition } from "@/services/exhibition";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function HomeScreen() {
  const router = useRouter();
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
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
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
            <MaterialIcons name="museum" size={64} color="#ccc" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#666",
                marginTop: 16,
              }}
            >
              갤러리를 선택해주세요
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 플로팅 바 위쪽 경계까지만 */}
      <View style={{ flex: 1, marginBottom: 92 }}>
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingTop: 0,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
        {/* 현재/과거 전시 탭 */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 12,
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: "#e5e5e5",
          }}
        >
          <Pressable
            onPress={() => setActiveTab("current")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "current" ? "#fff" : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: activeTab === "current" ? "600" : "500",
                color: activeTab === "current" ? "#000" : "#666",
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
              backgroundColor: activeTab === "past" ? "#fff" : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: activeTab === "past" ? "600" : "500",
                color: activeTab === "past" ? "#000" : "#666",
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
              const isSelected = exhibitionId === exh.id;
              return (
                <Pressable
                  key={exh.id}
                  onPress={() => handleExhibitionSelect(exh.id)}
                  style={{
                    width: "47%",
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                    overflow: "hidden",
                  }}
                >
                  {exh.poster_url ? (
                    <Image
                      source={{ uri: exh.poster_url }}
                      style={{
                        width: "100%",
                        height: 150,
                        borderRadius: 12,
                        marginBottom: 12,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: 150,
                        borderRadius: 12,
                        backgroundColor: "#f0f0f0",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <MaterialIcons name="photo" size={32} color="#bbb" />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: isSelected ? "#007AFF" : "#000",
                      marginBottom: 8,
                    }}
                    numberOfLines={2}
                  >
                    {exh.name}
                  </Text>
                  {(exh.start_date || exh.end_date) && (
                    <Text
                      style={{ fontSize: 12, color: "#666" }}
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
                  {isSelected && (
                    <View style={{ marginTop: 8, alignItems: "flex-end" }}>
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#007AFF"
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MaterialIcons name="event-busy" size={48} color="#ccc" />
            <Text style={{ fontSize: 16, color: "#666", marginTop: 12 }}>
              {activeTab === "current"
                ? "진행 중인 전시가 없습니다"
                : "과거 전시가 없습니다"}
            </Text>
          </View>
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}
