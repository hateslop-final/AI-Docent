import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/store/auth.store";
import { useAuthState } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";

const AGE_OPTIONS = [
  { label: "청소년", value: "teen" },
  { label: "성인", value: "adult" },
] as const;

export default function MyPageScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  
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
                  backgroundColor: "#007AFF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <MaterialIcons name="person" size={32} color="#fff" />
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
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    로그인하여 더 많은 기능을 이용하세요
                  </Text>
                </View>
              </View>

              {(age || aesthetic) && (
                <View style={{
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: "#f0f0f0",
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" }}>
                    선택한 정보
                  </Text>
                  
                  {age && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>
                        연령대: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                          {AGE_OPTIONS.find(opt => opt.value === age)?.label || age}
                        </Text>
                      </Text>
                    </View>
                  )}
                  
                  {aesthetic && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>
                        설명 수준: <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                          {getAestheticText(aesthetic)}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}
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
                  backgroundColor: "#F0F8FF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="person" size={20} color="#007AFF" />
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
                  backgroundColor: "#F0F8FF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <MaterialIcons name="settings" size={20} color="#007AFF" />
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
              {!age && !aesthetic && (
                <View style={{
                  padding: 16,
                  backgroundColor: "#FFF9E6",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FFE082",
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialIcons name="info-outline" size={18} color="#F57C00" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#F57C00", marginLeft: 8 }}>
                      안내
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                    온보딩을 완료하면 선택한 정보를 확인할 수 있습니다
                  </Text>
                </View>
              )}
              
              <Pressable
                onPress={() => router.push("/mypage/login")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 18,
                  backgroundColor: "#007AFF",
                  borderRadius: 12,
                  shadowColor: "#007AFF",
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
    </SafeAreaView>
  );
}
