import { Pressable, Text, ActivityIndicator, Alert, Image } from "react-native";
import { signInWithGoogle, getSession } from "@/services/auth";
import { useState } from "react";
import { useAuth } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@/store/onboarding.store";

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const { initialize, user } = useAuth();
  const router = useRouter();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);

  const handleGoogleSignIn = async () => {
    if (user) {
      return;
    }
    
    if (!age || !aesthetic) {
      router.push("/(onboarding)/age");
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();
      
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const session = await getSession();
          
          if (session?.user) {
            await initialize();
            return;
          }
        } catch (initError) {
          // 초기화 에러는 무시하고 계속 시도
        }
        
        attempts++;
      }
      
      try {
        await initialize();
      } catch (initError) {
        // 초기화 에러는 무시
      }
    } catch (error: any) {
      if (error.message && error.message.includes('취소')) {
        return;
      }
      Alert.alert("구글 로그인 실패", error.message || "구글 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleGoogleSignIn}
      disabled={loading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <>
          <Image
            source={require("@/assets/images/google_light.png")}
            style={{ width: 20, height: 20, marginRight: 5 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
            Google로 계속하기
          </Text>
        </>
      )}
    </Pressable>
  );
}
