import { View, Text, Image, ScrollView, Pressable, Modal } from "react-native";
import { DEFAULT_PROFILE_IMAGE_URL } from "@/services/storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/store/auth.store";
import { useAuthState } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";

const AGE_OPTIONS = [
  { label: "청소년", value: "teen" },
  { label: "성인", value: "adult" },
] as const;

const AESTHETIC_OPTIONS = [
  { key: "light", title: "가볍게", desc: "편하게 감상하고 싶어요", icon: "light-mode" },
  { key: "medium", title: "적당히", desc: "배경이 궁금해요", icon: "auto-awesome" },
  { key: "deep", title: "깊이 있게", desc: "맥락까지 알고 싶어요", icon: "menu-book" },
] as const;

export default function MyPageScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const setAge = useOnboardingStore((s) => s.setAge);
  const setAesthetic = useOnboardingStore((s) => s.setAesthetic);
  
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);
  
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

  const handleAgeSelect = (value: string) => {
    setAge(value);
    setShowAgeModal(false);
  };

  const handleAestheticSelect = (key: string) => {
    setAesthetic(key);
    setShowAestheticModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }} edges={["top"]}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 24 }}>
            마이페이지
          </Text>

          {/* 프로필 카드 */}
          {user ? (
            <View style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
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
                  borderColor: "#e5e5e5",
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
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                    {userProfile?.nickname || user.email?.split("@")[0] || "사용자"}
                  </Text>
                  {userProfile?.nickname && (
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>

              {(userProfile?.age_range || userProfile?.aesthetic_level) && (
                <View style={{
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: "#f0f0f0",
                }}>
                  {userProfile.age_range && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>
                        연령대: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                          {AGE_OPTIONS.find(opt => opt.value === userProfile.age_range)?.label || userProfile.age_range}
                        </Text>
                      </Text>
                    </View>
                  )}
                  {userProfile.aesthetic_level && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>
                        설명 수준: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                          {getAestheticText(userProfile.aesthetic_level)}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#e5e5e5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <MaterialIcons name="person-outline" size={32} color="#999" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                    게스트
                  </Text>
                  <Pressable onPress={() => router.push("/mypage/login")}>
                    <Text style={{ fontSize: 14, color: "#007AFF" }}>
                      로그인하여 더 많은 기능을 이용하세요
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: "#f0f0f0",
              }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" }}>
                  맞춤 설정
                </Text>
                
                <Pressable
                  onPress={() => setShowAgeModal(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <MaterialIcons name="person-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      연령대: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                        {age ? AGE_OPTIONS.find(opt => opt.value === age)?.label : "선택 안 함"}
                      </Text>
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </Pressable>
                
                <Pressable
                  onPress={() => setShowAestheticModal(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <MaterialIcons name="auto-awesome" size={18} color="#666" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      설명 수준: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                        {getAestheticText(aesthetic)}
                      </Text>
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* 메뉴 섹션 */}
        <View style={{ gap: 8 }}>
          {user ? (
            <>
              <Pressable
                onPress={() => router.push("/mypage/profile")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 18,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="person" size={20} color="#000" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#1a1a1a", flex: 1 }}>
                  프로필
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/mypage/settings")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 18,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="settings" size={20} color="#000" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#1a1a1a", flex: 1 }}>
                  설정
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </Pressable>

              <View style={{ marginTop: 8 }}>
                <Pressable
                  onPress={async () => {
                    await signOut();
                    router.replace("/(tabs)");
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#FFF0F0",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <MaterialIcons name="logout" size={20} color="#FF3B30" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "500", color: "#FF3B30", flex: 1 }}>
                    로그아웃
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* 앱 기능 안내 섹션 */}
              <Pressable
                onPress={() => router.push("/mypage/features")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 18,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                  marginBottom: 8,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="info-outline" size={20} color="#007AFF" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#1a1a1a", flex: 1 }}>
                  앱 기능 안내
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/mypage/login")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 18,
                  backgroundColor: "#000",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <MaterialIcons name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
                  로그인
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* 연령대 선택 모달 */}
      <Modal
        visible={showAgeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAgeModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }}>
                연령대 선택
              </Text>
              <Pressable onPress={() => setShowAgeModal(false)}>
                <MaterialIcons name="close" size={24} color="#1a1a1a" />
              </Pressable>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <View style={{ gap: 12 }}>
              {AGE_OPTIONS.map((option) => {
                const isSelected = age === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleAgeSelect(option.value)}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                      backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#007AFF" : "#1a1a1a",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 설명 수준 선택 모달 */}
      <Modal
        visible={showAestheticModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAestheticModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }}>
                설명 수준 선택
              </Text>
              <Pressable onPress={() => setShowAestheticModal(false)}>
                <MaterialIcons name="close" size={24} color="#1a1a1a" />
              </Pressable>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <View style={{ gap: 16 }}>
              {AESTHETIC_OPTIONS.map((option) => {
                const isSelected = aesthetic === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleAestheticSelect(option.key)}
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                      backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <MaterialIcons
                        name={option.icon as any}
                        size={28}
                        color={isSelected ? "#007AFF" : "#666"}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: isSelected ? "700" : "600",
                          color: isSelected ? "#007AFF" : "#1a1a1a",
                        }}
                      >
                        {option.title}
                      </Text>
                    </View>
                    <Text
                      style={{
                        marginLeft: 40,
                        fontSize: 15,
                        color: isSelected ? "#007AFF" : "#666",
                        lineHeight: 22,
                      }}
                    >
                      {option.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
