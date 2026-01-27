import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useMemo, ReactNode } from "react";
import { fetchExhibitionById, Exhibition } from "@/services/exhibition";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuth } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import { ChatDatabaseService } from "@/services/chathistory_service";
import { useTheme } from "@/components/ThemeProvider";

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

  const { user } = useAuth();
  const { colors } = useTheme();
  const setExhibitionId = useOnboardingStore((s) => s.setExhibition);
  const openSessionModal = useChatStore((s) => s.openSessionModal);

  const goToChat = async () => {
    if (!exhibition) return;
    
    // 전시 설정
    setExhibitionId(exhibition.id);
    
    // 로그인한 사용자이고 세션이 있는지 확인
    if (user) {
      try {
        const existingSessions = await ChatDatabaseService.listSessions(user.id, exhibition.id);
        if (existingSessions.length > 0) {
          // 세션이 있으면 모달 열기 요청
          openSessionModal();
        }
      } catch (error) {
        console.error('[ExhibitionDetail] 세션 확인 실패:', error);
      }
    }
    
    // 채팅 화면으로 이동
    router.push(`/chat?exhibitionId=${exhibition.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: exhibition?.name || "전시 상세",
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />

      {/* 이전 버튼 */}
      <View style={[styles.backButtonContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>이전</Text>
        </TouchableOpacity>
      </View>

      {/* 플로팅 바 위쪽 경계까지만 */}
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        ) : (
          exhibition && (
            <View>
              {exhibition.poster_url ? (
                <Image
                  source={{ uri: exhibition.poster_url }}
                  style={styles.posterImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <MaterialIcons name="collections" size={44} color="#bbb" />
                </View>
              )}

              <View style={styles.infoContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{exhibition.name}</Text>

                {renderDateRange ? (
                  <Text style={[styles.dateRange, { color: colors.textSecondary }]}>{renderDateRange}</Text>
                ) : null}

                {exhibition.location && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="place" size={18} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{exhibition.location}</Text>
                  </View>
                )}

                {exhibition.admission_fee && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="paid" size={18} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      입장료: {exhibition.admission_fee}
                    </Text>
                  </View>
                )}
              </View>

              {/* AI 채팅하기 버튼 - 강조 */}
              <TouchableOpacity
                onPress={goToChat}
                style={[styles.chatButton, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="chat-bubble" size={24} color={colors.primary === "#1a1a1a" ? "#ffffff" : "#1a1a1a"} />
                <Text style={[styles.chatButtonText, { color: colors.primary === "#1a1a1a" ? "#ffffff" : "#1a1a1a" }]}>CURAT과 채팅하기</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.primary === "#1a1a1a" ? "#ffffff" : "#1a1a1a"} />
              </TouchableOpacity>

              <View style={styles.sectionsContainer}>
                {exhibition.description && (
                  <Section title="전시 소개" colors={colors}>
                    <Text style={[styles.descriptionText, { color: colors.text }]}>
                      {exhibition.description}
                    </Text>
                  </Section>
                )}

                {exhibition.info && (
                  <Section title="관람 안내" colors={colors}>
                    <Text style={[styles.descriptionText, { color: colors.text }]}>
                      {exhibition.info}
                    </Text>
                  </Section>
                )}

                {exhibition.brochure && (
                  <Section title="브로셔" colors={colors}>
                    <TouchableOpacity
                      onPress={openBrochure}
                      style={[styles.secondaryButton, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
                    >
                      <MaterialIcons name="description" size={20} color={colors.text} />
                      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
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
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: ReactNode;
  colors: any;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderBottomWidth: 1,
    marginBottom:16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    marginBottom: 92,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  posterImage: {
    width: "100%",
    height: 200,
    marginBottom: 32,
  },
  posterPlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 14,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  chatButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chatButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 22,
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
