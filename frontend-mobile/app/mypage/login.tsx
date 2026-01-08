import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { signIn } from "@/services/auth";
import { useAuth, useAuthState, useAuth as authStore } from "@/store/auth.store";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginScreen() {
  const router = useRouter();
  const { initialize, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 인증 상태 변경 감지
  useAuthState();

  // 로그인 완료 시 프로필 확인 후 처리 (한 번만 실행)
  const hasProcessedLogin = useRef(false);
  
  useEffect(() => {
    if (user && !hasProcessedLogin.current) {
      hasProcessedLogin.current = true;
      setTimeout(async () => {
        const { userProfile, loadUserProfile } = authStore.getState();
        await loadUserProfile();
        const updatedProfile = authStore.getState().userProfile;
        
        // 처음 로그인인 경우 (닉네임이 없으면)
        if (!updatedProfile?.nickname) {
          // 프로필 설정 화면으로 이동
          router.replace("/mypage/profile");
        } else {
          router.back();
        }
      }, 500);
    } else if (!user) {
      // 로그아웃 시 플래그 리셋
      hasProcessedLogin.current = false;
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      // 인증 상태 업데이트 (useEffect에서 프로필 확인 및 리다이렉트 처리)
      await initialize();
    } catch (error: any) {
      Alert.alert("로그인 실패", error.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
          <Text style={{ marginLeft: 8, fontSize: 16 }}>뒤로</Text>
        </Pressable>

        {/* 제목 */}
        <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
          로그인
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
          AI 도슨트에 오신 것을 환영합니다
        </Text>

        {/* 입력 폼 */}
        <View style={{ gap: 16, marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
              이메일
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
              placeholder="이메일을 입력하세요"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
              비밀번호
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
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 로그인 버튼 */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#007AFF",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
            {loading ? "로그인 중..." : "로그인"}
          </Text>
        </Pressable>

        {/* 구분선 */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5e5e5" }} />
          <Text style={{ marginHorizontal: 16, fontSize: 14, color: "#666" }}>또는</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5e5e5" }} />
        </View>

        {/* 구글 로그인 버튼 */}
        <View style={{ marginBottom: 16 }}>
          <GoogleLoginButton />
        </View>

        {/* 회원가입 링크 */}
        <Pressable
          onPress={() => router.push("/mypage/signup")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: "#666" }}>
            계정이 없으신가요?{" "}
          </Text>
          <Text style={{ fontSize: 14, color: "#007AFF", fontWeight: "600" }}>
            회원가입
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
