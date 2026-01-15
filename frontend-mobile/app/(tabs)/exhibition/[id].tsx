import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useMemo, ReactNode } from "react";
import { fetchExhibitionById, Exhibition } from "@/services/exhibition";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ExhibitionDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const exhibitionId = Number(params.id);

  useEffect(() => {
    if (!exhibitionId) return;
    setLoading(true);
    fetchExhibitionById(exhibitionId)
      .then((data) => {
        if (!data) {
          setError("전시를 찾을 수 없습니다.");
        }
        setExhibition(data);
      })
      .catch((err) => {
        console.error("전시 상세 조회 실패:", err);
        setError(err.message || "전시를 불러오는 데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [exhibitionId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const renderDateRange = useMemo(() => {
    if (!exhibition) return null;
    if (exhibition.start_date && exhibition.end_date) {
      return `${formatDate(exhibition.start_date)} - ${formatDate(
        exhibition.end_date
      )}`;
    }
    if (exhibition.start_date) {
      return `${formatDate(exhibition.start_date)}부터`;
    }
    if (exhibition.end_date) {
      return `${formatDate(exhibition.end_date)}까지`;
    }
    return exhibition.is_now ? "현재 전시 중" : "";
  }, [exhibition]);

  const openBrochure = () => {
    if (!exhibition?.brochure) return;
    Linking.openURL(exhibition.brochure).catch(() =>
      setError("브로셔 링크와 연결할 수 없습니다.")
    );
  };

  const goToChat = () => {
    if (!exhibition) return;
    router.push(`/chat?exhibitionId=${exhibition.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen
        options={{
          headerTitle: exhibition?.name || "전시 상세",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 64,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <MaterialIcons name="error-outline" size={56} color="#FF3B30" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                color: "#666",
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        ) : (
          exhibition && (
            <View>
              {exhibition.poster_url ? (
                <Image
                  source={{ uri: exhibition.poster_url }}
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 16,
                    marginBottom: 20,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 16,
                    backgroundColor: "#f0f0f0",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <MaterialIcons name="collections" size={44} color="#bbb" />
                </View>
              )}

              <Text style={{ fontSize: 20, fontWeight: "700" }}>
                {exhibition.name}
              </Text>

              {renderDateRange ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#666",
                    marginTop: 6,
                    letterSpacing: 0.3,
                  }}
                >
                  {renderDateRange}
                </Text>
              ) : null}

              {exhibition.location && (
                <View
                  style={{
                    marginTop: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="place" size={18} color="#007AFF" />
                  <Text style={{ fontSize: 14, color: "#333" }}>
                    {exhibition.location}
                  </Text>
                </View>
              )}

              {exhibition.admission_fee && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="paid" size={18} color="#FF9500" />
                  <Text style={{ fontSize: 14, color: "#333" }}>
                    입장료: {exhibition.admission_fee}
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 24, gap: 12 }}>
                <Section title="AI 도슨트">
                  <TouchableOpacity
                    onPress={goToChat}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: "#007AFF",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      AI 채팅하기
                    </Text>
                  </TouchableOpacity>
                </Section>

                {exhibition.description && (
                  <Section title="설명">
                    <Text style={{ color: "#2D2D2D", lineHeight: 22 }}>
                      {exhibition.description}
                    </Text>
                  </Section>
                )}

                {exhibition.info && (
                  <Section title="안내">
                    <Text style={{ color: "#2D2D2D", lineHeight: 22 }}>
                      {exhibition.info}
                    </Text>
                  </Section>
                )}

                {exhibition.brochure && (
                  <Section title="브로셔">
                    <TouchableOpacity
                      onPress={openBrochure}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: "#007AFF",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        브로셔 보기
                      </Text>
                    </TouchableOpacity>
                  </Section>
                )}
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F3F5",
        padding: 16,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 8,
          color: "#444",
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
