import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";

export default function Splash() {
  const router = useRouter();
  const { user, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const gallery = useOnboardingStore((s) => s.gallery);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const hasNavigated = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    let timer: ReturnType<typeof setTimeout>;
    let checkTimer: ReturnType<typeof setInterval>;

    const navigate = () => {
      if (hasNavigated.current) return;
      
      timer = setTimeout(() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        
        if (user) {
          if (gallery) {
            router.replace("/(tabs)");
          } else {
            router.replace("/(onboarding)/gallery");
          }
        } else if (gallery) {
          router.replace("/(tabs)");
        } else if (age && aesthetic) {
          router.replace("/(onboarding)/gallery");
        } else if (age) {
          router.replace("/(onboarding)/aesthetic");
        } else {
          router.replace("/(onboarding)/age");
        }
      }, 2000);
    };

    // Only run navigation logic when this splash route is active. This prevents
    // other parts of the app (that also read onboarding store) from causing
    // the splash navigations when they update global onboarding state.
    if (!pathname?.includes("/splash")) return;

    if (initialized) {
      navigate();
    } else {
      checkTimer = setInterval(() => {
        if (initialized) {
          clearInterval(checkTimer);
          navigate();
        }
      }, 100);
      
      setTimeout(() => {
        if (checkTimer) clearInterval(checkTimer);
        navigate();
      }, 3000);
  }

    return () => {
      if (timer) clearTimeout(timer);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [user, initialized, age, aesthetic, gallery, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F4EF" }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 12,
              letterSpacing: -0.5,
            }}
          >
            내 안의 작은 미술관
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: "#666",
              fontWeight: "500",
              letterSpacing: 2,
            }}
          >
            AI Docent
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}