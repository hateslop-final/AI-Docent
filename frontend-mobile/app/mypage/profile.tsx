import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/store/auth.store";
import { useEffect, useState } from "react";
import { updateUserProfile } from "@/services/auth";
import { useOnboardingStore } from "@/store/onboarding.store";

const AGE_OPTIONS = [
  { label: "청소년", value: "teen" },
  { label: "성인", value: "adult" },
] as const;

const AESTHETIC_OPTIONS = [
  { key: "light", title: "가볍게", desc: "편하게 감상하고 싶어요" },
  { key: "medium", title: "적당히", desc: "배경이 궁금해요" },
  { key: "deep", title: "깊이 있게", desc: "맥락까지 알고 싶어요" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, loadUserProfile } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const [nickname, setNickname] = useState("");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isFirstTime = !userProfile?.nickname;

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile?.nickname) {
      setNickname(userProfile.nickname || "");
      setSelectedAge(userProfile.age_range || null);
      setSelectedAesthetic(userProfile.aesthetic_level || null);
    } else {
      setNickname(userProfile?.nickname || "");
      setSelectedAge(age || userProfile?.age_range || null);
      setSelectedAesthetic(aesthetic || userProfile?.aesthetic_level || null);
    }
  }, [userProfile, age, aesthetic]);

  const handleSave = async () => {
    if (!user) return;

    if (!nickname.trim()) {
      Alert.alert("오류", "닉네임을 입력해주세요.");
      return;
    }

    if (!selectedAge) {
      Alert.alert("오류", "연령대를 선택해주세요.");
      return;
    }

    if (!selectedAesthetic) {
      Alert.alert("오류", "설명 수준을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(user.id, {
        nickname: nickname.trim(),
        age_range: selectedAge || undefined,
        aesthetic_level: selectedAesthetic,
      });
      await loadUserProfile();
      
      if (isFirstTime) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("성공", "프로필이 업데이트되었습니다.", [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert("오류", error.message || "프로필 업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>로그인이 필요합니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}>
          {!isFirstTime && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 16 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </Pressable>
          )}
          <Text style={{ fontSize: 20, fontWeight: "700", flex: 1 }}>
            {isFirstTime ? "프로필 설정" : "프로필"}
          </Text>
          {isFirstTime ? (
            <Pressable
              onPress={handleSave}
              disabled={loading || !nickname.trim() || !selectedAge || !selectedAesthetic}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: (loading || !nickname.trim() || !selectedAge || !selectedAesthetic) ? "#ccc" : "#007AFF",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {loading ? "저장 중..." : "시작하기"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={loading}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: loading ? "#ccc" : "#007AFF",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {loading ? "저장 중..." : "저장"}
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#007AFF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              <MaterialIcons name="person" size={48} color="#fff" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 4 }}>
              {userProfile?.nickname || user?.email || "사용자"}
            </Text>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
              {user?.email}
            </Text>
          </View>

          {isFirstTime && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, color: "#666", marginBottom: 24, textAlign: "center" }}>
                서비스를 이용하기 위해{'\n'}닉네임을 입력해주세요
              </Text>
            </View>
          )}

          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
                닉네임 {isFirstTime && <Text style={{ color: "#FF3B30" }}>*</Text>}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e5e5",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#f9f9f9",
                }}
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
                연령대 {isFirstTime && <Text style={{ color: "#FF3B30" }}>*</Text>}
              </Text>
              <View style={{ gap: 8 }}>
                {AGE_OPTIONS.map((option) => {
                  const isSelected = selectedAge === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSelectedAge(isSelected ? null : option.value)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                        backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#007AFF" : "#1a1a1a",
                      }}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
                설명 수준 {isFirstTime && <Text style={{ color: "#FF3B30" }}>*</Text>}
              </Text>
              <View style={{ gap: 12 }}>
                {AESTHETIC_OPTIONS.map((option) => {
                  const isSelected = selectedAesthetic === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setSelectedAesthetic(isSelected ? null : option.key)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                        backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#007AFF" : "#1a1a1a",
                        marginBottom: 4,
                      }}>
                        {option.title}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: isSelected ? "#007AFF" : "#666",
                      }}>
                        {option.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {!isFirstTime && (
              <View>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  이메일
                </Text>
                <View style={{
                  padding: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 12,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: "500" }}>
                    {user?.email || "-"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
