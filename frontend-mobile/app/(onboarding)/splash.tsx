import { View, Animated, StyleSheet, Dimensions, StatusBar } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();
  const pathname = usePathname();

  /** 기존 데이터 및 로직 복구 */
  const { user, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const gallery = useOnboardingStore((s) => s.gallery);
  const hasNavigated = useRef(false);

  /** 애니메이션 값 */
  const animStep1 = useRef(new Animated.Value(0)).current; // 회전 + 자리잡기
  const animStep2 = useRef(new Animated.Value(0)).current; // 상하로 열리기
  const textOpacity = useRef(new Animated.Value(0)).current;

  /** Auth 초기화 */
  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized]);

  /** 애니메이션 실행 시퀀스 (보여주신 스타일 유지) */
  useEffect(() => {
    Animated.sequence([
      // [STEP 1] 90도 회전하며 상/하단으로 밀착 (1.2초)
      Animated.delay(1000),
      Animated.timing(animStep1, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      // [STEP 2] 상하로 완전히 열림 (1초)
      Animated.timing(animStep2, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 텍스트 등장 타이밍
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 1400,
      useNativeDriver: true,
    }).start();
  }, []);

  /** 라우팅 로직 복구 */
  useEffect(() => {
    if (!pathname?.includes("/splash")) return;
    if (!initialized || hasNavigated.current) return;

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (user) {
        if (gallery) router.replace("/(tabs)");
        else router.replace("/(onboarding)/gallery");
      } else if (gallery) {
        router.replace("/(tabs)");
      } else if (age && aesthetic) {
        router.replace("/(onboarding)/gallery");
      } else if (age) {
        router.replace("/(onboarding)/aesthetic");
      } else {
        router.replace("/(onboarding)/age");
      }
    }, 5000); // 전체 애니메이션 완료 후 이동

    return () => clearTimeout(timer);
  }, [initialized, user, age, aesthetic, gallery, pathname]);

  // ---------------------------------------------------------
  // 1번 사각형 (왼쪽 -> 상단) 로직
  // ---------------------------------------------------------
  const rect1Rotate = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  const rect1MoveX = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 4],
  });
  const rect1MoveY = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT / 4],
  });
  const rect1ExitY = animStep2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT],
  });

  // ---------------------------------------------------------
  // 2번 사각형 (오른쪽 -> 하단) 로직
  // ---------------------------------------------------------
  const rect2Rotate = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  const rect2MoveX = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH / 4],
  });
  const rect2MoveY = animStep1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT / 4],
  });
  const rect2ExitY = animStep2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.content}>
        
        {/* Rectangle 1 (상단) */}
        <Animated.View
          style={[
            styles.rectangle,
            { backgroundColor: "#1a1a1a", left: 0 },
            {
              transform: [
                { translateX: rect1MoveX },
                { translateY: rect1MoveY },
                { rotate: rect1Rotate },
                { translateY: rect1ExitY },
              ],
            },
          ]}
        />

        {/* Rectangle 2 (하단) */}
        <Animated.View
          style={[
            styles.rectangle,
            { backgroundColor: "#1a1a1a", right: 0 },
            {
              transform: [
                { translateX: rect2MoveX },
                { translateY: rect2MoveY },
                { rotate: rect2Rotate },
                { translateY: rect2ExitY },
              ],
            },
          ]}
        />

        {/* 중앙 텍스트 (기존 스타일로 복구) */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Animated.Text style={styles.title}>
            나만의 AI DOCENT
          </Animated.Text>
          <Animated.Text style={styles.subtitle}>
            CURAT
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  rectangle: {
    position: "absolute",
    width: SCREEN_WIDTH / 2,
    height: SCREEN_HEIGHT * 2,
  },
  textContainer: {
    alignItems: "center",
    position: "absolute",
    zIndex: 10,
  },
  title: {
    fontSize: 46, // 기존 텍스트 크기 복구
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 20, // 기존 텍스트 크기 복구
    color: "#6b7280",
    letterSpacing: 4,
  },
});