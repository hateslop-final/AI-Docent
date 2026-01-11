import { View, Text, ScrollView, Pressable, TextInput, Alert, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/store/auth.store";
import { useEffect, useState } from "react";
import { updateUserProfile } from "@/services/auth";
import { useOnboardingStore } from "@/store/onboarding.store";
import * as ImagePicker from "expo-image-picker";
import { uploadProfileImage, DEFAULT_PROFILE_IMAGE_URL } from "@/services/storage";

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
  const [avatarUri, setAvatarUri] = useState<string>(DEFAULT_PROFILE_IMAGE_URL);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const isFirstTime = !userProfile?.nickname;

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || "");
      setSelectedAge(userProfile.age_range || null);
      setSelectedAesthetic(userProfile.aesthetic_level || null);
      
      // userProfile에서 이미지 URL 가져오기 (캐시 무효화)
      const profileImgUrl = userProfile.user_profile_img_url;
      if (profileImgUrl) {
        // 캐시 무효화를 위해 타임스탬프 추가
        const urlWithCacheBust = `${profileImgUrl}?t=${Date.now()}`;
        setAvatarUri(urlWithCacheBust);
        setHasCustomImage(true);
      } else {
        setAvatarUri(DEFAULT_PROFILE_IMAGE_URL);
        setHasCustomImage(false);
      }
    } else {
      // userProfile이 없을 때는 기본값 설정
      setNickname("");
      setSelectedAge(age || null);
      setSelectedAesthetic(aesthetic || null);
      setAvatarUri(DEFAULT_PROFILE_IMAGE_URL);
      setHasCustomImage(false);
    }
  }, [userProfile, age, aesthetic]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        if (selectedImage.uri) {
          setUploadingImage(true);
          try {
            const imageUrl = await uploadProfileImage(user!.id, selectedImage.uri);
            
            // 즉시 UI에 반영
            setAvatarUri(imageUrl);
            setHasCustomImage(true);
            
            // DB에 저장 (쿼리 파라미터 제거한 URL 저장)
            const cleanUrl = imageUrl.split('?')[0];
            await updateUserProfile(user!.id, {
              user_profile_img_url: cleanUrl,
            });
            
            // 프로필 다시 로드
            await loadUserProfile();
            
            // 로드 후에도 이미지 URL 유지 (캐시 무효화)
            setTimeout(() => {
              setAvatarUri(`${cleanUrl}?t=${Date.now()}`);
            }, 100);
          } catch (error: any) {
            console.error("이미지 업로드 오류:", error);
            Alert.alert(
              "업로드 실패", 
              error.message || "이미지 업로드에 실패했습니다.\n\nStorage 권한을 확인해주세요."
            );
          } finally {
            setUploadingImage(false);
          }
        }
      }
    } catch (error: any) {
      setUploadingImage(false);
      if (error.message && !error.message.includes("User canceled")) {
        Alert.alert("오류", error.message || "이미지 선택에 실패했습니다.");
      }
    }
  };

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
        user_profile_img_url: hasCustomImage ? avatarUri || undefined : DEFAULT_PROFILE_IMAGE_URL,
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
                backgroundColor: (loading || !nickname.trim() || !selectedAge || !selectedAesthetic) ? "#ccc" : "#000",
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
                backgroundColor: loading ? "#ccc" : "#000",
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
            <Pressable
              onPress={handlePickImage}
              disabled={uploadingImage}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#000",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "#e5e5e5",
              }}
            >
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
              {uploadingImage && (
                <View
                  style={{
                    position: "absolute",
                    width: 100,
                    height: 100,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#000",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="camera-alt" size={18} color="#fff" />
                </View>
              </View>
            </Pressable>
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
                        borderColor: isSelected ? "#000" : "#e5e5e5",
                        backgroundColor: isSelected ? "#f5f5f5" : "#fff",
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#000" : "#1a1a1a",
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
                        borderColor: isSelected ? "#000" : "#e5e5e5",
                        backgroundColor: isSelected ? "#f5f5f5" : "#fff",
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#000" : "#1a1a1a",
                        marginBottom: 4,
                      }}>
                        {option.title}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: isSelected ? "#000" : "#666",
                      }}>
                        {option.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
