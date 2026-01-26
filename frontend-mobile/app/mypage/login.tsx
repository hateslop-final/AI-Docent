import { View, Text, TextInput, Pressable, Alert, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { signIn } from "@/services/auth";
import { useAuth, useAuthState, useAuth as authStore } from "@/store/auth.store";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { AppleLoginButton } from "@/components/AppleLoginButton";

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          <Text style={styles.backButtonText}>뒤로</Text>
        </Pressable>

        {/* 제목 */}
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>
          AI 도슨트에 오신 것을 환영합니다
        </Text>

        {/* 입력 폼 */}
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#999"
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
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "로그인 중..." : "로그인"}
          </Text>
        </Pressable>

        {/* 구분선 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 버튼 */}
        <View style={styles.googleButtonContainer}>
          <GoogleLoginButton />
          <AppleLoginButton />
        </View>

        {/* 회원가입 링크 */}
        <Pressable
          onPress={() => router.push("/mypage/signup")}
          style={styles.signupLink}
        >
          <Text style={styles.signupLinkText}>
            계정이 없으신가요?{" "}
          </Text>
          <Text style={styles.signupLinkButton}>
            회원가입
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
  loginButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#666",
  },
  googleButtonContainer: {
    marginBottom: 16,
  },
  signupLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  signupLinkText: {
    fontSize: 14,
    color: "#666",
  },
  signupLinkButton: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
