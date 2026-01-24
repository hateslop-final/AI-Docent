import { View, Text, Image, ScrollView, Pressable, Modal, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/store/auth.store";
import { useAuthState } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useTheme } from "@/components/ThemeProvider";

const AGE_OPTIONS = [
  { label: "청소년", value: "teen" },
  { label: "성인", value: "adult" },
] as const;

const AESTHETIC_OPTIONS = [
  { key: "light", title: "가볍게", desc: "편하게 감상하고 싶어요" },
  { key: "medium", title: "적당히", desc: "배경이 궁금해요" },
  { key: "deep", title: "깊이 있게", desc: "맥락까지 알고 싶어요" },
] as const;


export default function MyPageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile, signOut, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const setAge = useOnboardingStore((s) => s.setAge);
  const setAesthetic = useOnboardingStore((s) => s.setAesthetic);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  
  // 모달 애니메이션
  const ageModalSlideAnim = useRef(new Animated.Value(300)).current;
  const aestheticModalSlideAnim = useRef(new Animated.Value(300)).current;
  
  // 모달 닫기 함수
  const closeAgeModal = () => {
    Animated.timing(ageModalSlideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAgeModal(false);
    });
  };
  
  const closeAestheticModal = () => {
    Animated.timing(aestheticModalSlideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAestheticModal(false);
    });
  };
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);
  
  // 연령대 모달 애니메이션
  useEffect(() => {
    if (showAgeModal) {
      Animated.spring(ageModalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [showAgeModal]);
  
  // 설명 수준 모달 애니메이션
  useEffect(() => {
    if (showAestheticModal) {
      Animated.spring(aestheticModalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [showAestheticModal]);
  
  useAuthState();

  const getAestheticText = (level?: string) => {
    switch (level) {
      case "light":
        return "가볍게";
      case "medium":
        return "적당히";
      case "deep":
        return "깊이 있게";
      default:
        return "선택 안 함";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* 전체 배경 레이어 */}
  
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
    

          {/* 프로필 카드 */}
          {user ? (
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#000",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: colors.border,
                }}>
                  {userProfile?.user_profile_img_url ? (
                    <Image
                      source={{ uri: userProfile.user_profile_img_url }}
                      style={{ width: 64, height: 64 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons name="person" size={32} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                    {userProfile?.nickname || user.email?.split("@")[0] || "사용자"}
                  </Text>
                  {userProfile?.nickname && (
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>

              {(userProfile?.age_range || userProfile?.aesthetic_level) && (
                <View style={{
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                  {userProfile.age_range && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
                        연령대: <Text style={{ fontWeight: "600", color: colors.text }}>
                          {AGE_OPTIONS.find(opt => opt.value === userProfile.age_range)?.label || userProfile.age_range}
                        </Text>
                      </Text>
                    </View>
                  )}
                  {userProfile.aesthetic_level && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
                        설명 수준: <Text style={{ fontWeight: "600", color: colors.text }}>
                          {getAestheticText(userProfile.aesthetic_level)}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.guestCard, { backgroundColor: colors.cardBackground }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <MaterialIcons name="person-outline" size={32} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                    게스트
                  </Text>
                  <Pressable onPress={() => router.push("/mypage/login")}>
                    <Text style={{ fontSize: 14, color: colors.text }}>
                    로그인하여 더 많은 기능을 이용하세요
                  </Text>
                  </Pressable>
                </View>
              </View>

              {(age || aesthetic) && (
                <View style={{
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: colors.text }}>
                    선택한 정보
                  </Text>
                  
                  {age && (
                    <Pressable 
                      onPress={() => setShowAgeModal(true)}
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingVertical: 4 }}
                    >
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
                        연령대: <Text style={{ fontWeight: "600", color: colors.text }}>
                          {AGE_OPTIONS.find(opt => opt.value === age)?.label || age}
                        </Text>
                      </Text>
                      <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                  
                  {aesthetic && (
                    <Pressable 
                      onPress={() => setShowAestheticModal(true)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}
                    >
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
                        설명 수준: <Text style={{ fontWeight: "600", color: colors.text }}>
                          {getAestheticText(aesthetic)}
                        </Text>
                      </Text>
                      <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

        {/* 메뉴 섹션 */}
        <View style={{ gap: 8 }}>
          {user ? (
            <>
              <Pressable
                onPress={() => router.push("/mypage/profile")}
                style={[styles.menuButton, { backgroundColor: colors.cardBackground }]}
              >
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>
                  프로필
                </Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                onPress={() => router.push("/mypage/settings")}
                style={[styles.menuButton, { backgroundColor: colors.cardBackground }]}
              >
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>
                  설정
                </Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </Pressable>

              <View style={{ marginTop: 8 }}>
                <Pressable
                  onPress={async () => {
                    await signOut();
                    router.replace("/(tabs)");
                  }}
                  style={[styles.menuButton, { backgroundColor: colors.cardBackground }]}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <MaterialIcons name="logout" size={20} color={colors.text} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>
                    로그아웃
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {!age && !aesthetic && (
                <View style={[styles.infoBox, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginLeft: 8 }}>
                      안내
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                    온보딩을 완료하면 선택한 정보를 확인할 수 있습니다
                  </Text>
                </View>
              )}
              
              <Pressable
                onPress={() => router.push("/mypage/features")}
                style={[styles.menuButton, { backgroundColor: colors.cardBackground }]}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="info-outline" size={20} color={colors.text} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>
                  앱 기능 안내
                </Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/mypage/login")}
                style={[styles.loginButton, { backgroundColor: colors.cardBackground }]}
              >
                <MaterialIcons name="login" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                  로그인
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* 연령대 선택 모달 */}
        <Modal
          visible={showAgeModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeAgeModal}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
            onPress={closeAgeModal}
          >
            <Animated.View 
              style={{ 
                backgroundColor: colors.cardBackground, 
                borderTopLeftRadius: 20, 
                borderTopRightRadius: 20, 
                padding: 24,
                transform: [{ translateY: ageModalSlideAnim }],
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 24, color: colors.text }}>연령대 선택</Text>
              {AGE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setAge(option.value);
                    closeAgeModal();
                  }}
                  style={{
                    padding: 16,
                    backgroundColor: age === option.value ? colors.primaryLight : colors.cardBackground,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: age === option.value ? 2 : 1,
                    borderColor: age === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: age === option.value ? "600" : "500", color: colors.text }}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={closeAgeModal}
                style={{ marginTop: 12, padding: 16, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>취소</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* 설명 수준 선택 모달 */}
        <Modal
          visible={showAestheticModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeAestheticModal}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
            onPress={closeAestheticModal}
          >
            <Animated.View 
              style={{ 
                backgroundColor: colors.cardBackground, 
                borderTopLeftRadius: 20, 
                borderTopRightRadius: 20, 
                padding: 24,
                transform: [{ translateY: aestheticModalSlideAnim }],
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 24, color: colors.text }}>설명 수준 선택</Text>
              {AESTHETIC_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setAesthetic(option.key);
                    closeAestheticModal();
                  }}
                  style={{
                    padding: 16,
                    backgroundColor: aesthetic === option.key ? colors.primaryLight : colors.cardBackground,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: aesthetic === option.key ? 2 : 1,
                    borderColor: aesthetic === option.key ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: aesthetic === option.key ? "600" : "500", color: colors.text, marginBottom: 4 }}>
                    {option.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{option.desc}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={closeAestheticModal}
                style={{ marginTop: 12, padding: 16, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>취소</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  guestCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});
