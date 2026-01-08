import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { signUp } from "@/services/auth";
import { useAuth } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";

export default function SignUpScreen() {
  const router = useRouter();
  const { initialize } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 이메일 형식 검증
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("오류", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("오류", "비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    try {
      setLoading(true);
      // 온보딩에서 선택한 age와 aesthetic을 users 테이블에 저장
      const result = await signUp(
        email.trim(),
        password,
        nickname.trim() || undefined,
        age || undefined,
        aesthetic || undefined
      );
      
      if (!result.user) {
        // 이메일 인증이 필요한 경우
        Alert.alert(
          "회원가입 완료",
          "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
          [
            {
              text: "확인",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        // 즉시 로그인된 경우
        Alert.alert(
          "회원가입 완료",
          "회원가입이 완료되었습니다.",
          [
            {
              text: "확인",
              onPress: () => {
                // 인증 상태 업데이트
                initialize();
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "회원가입에 실패했습니다.";
      
      if (error.message) {
        if (error.message.includes("Unable to validate email address")) {
          errorMessage = "올바른 이메일 형식을 입력해주세요.";
        } else if (error.message.includes("Database error saving new user")) {
          errorMessage = "데이터베이스 오류가 발생했습니다. 관리자에게 문의하세요.\n\n(Trigger 오류일 수 있습니다)";
        } else if (error.message.includes("User already registered")) {
          errorMessage = "이미 등록된 이메일입니다.";
        } else if (error.message.includes("Password")) {
          errorMessage = "비밀번호 요구사항을 확인해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("회원가입 실패", errorMessage);
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
          회원가입
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
          AI 도슨트 계정을 만들어보세요
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
              닉네임 (선택사항)
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
              autoCapitalize="none"
            />
          </View>

          {/* 온보딩에서 받은 필수 정보 */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
              온보딩에서 받은 필수 정보
            </Text>
            <View style={{
              padding: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e5e5",
            }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  연령대
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#1a1a1a" }}>
                  {age || "선택 안 함"}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  설명 수준
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#1a1a1a" }}>
                  {aesthetic === "light" ? "가볍게" : aesthetic === "medium" ? "적당히" : aesthetic === "deep" ? "깊이 있게" : "선택 안 함"}
                </Text>
              </View>
            </View>
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
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" }}>
              비밀번호 확인
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
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 회원가입 버튼 */}
        <Pressable
          onPress={handleSignUp}
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
            {loading ? "가입 중..." : "회원가입"}
          </Text>
        </Pressable>

        {/* 로그인 링크 */}
        <Pressable
          onPress={() => router.push("/mypage/login")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: "#666" }}>
            이미 계정이 있으신가요?{" "}
          </Text>
          <Text style={{ fontSize: 14, color: "#007AFF", fontWeight: "600" }}>
            로그인
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
