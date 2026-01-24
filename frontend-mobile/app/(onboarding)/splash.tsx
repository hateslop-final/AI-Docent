import { View, Animated, StyleSheet, StatusBar } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { SvgXml } from "react-native-svg";

const LOGO_SVG = `<svg width="113" height="25" viewBox="0 0 113 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.73 24.446C10.0073 24.446 8.432 24.1513 7.004 23.562C5.576 22.9726 4.34066 22.134 3.298 21.046C2.25533 19.9353 1.43933 18.632 0.849997 17.136C0.28333 15.6173 -2.86102e-06 13.9626 -2.86102e-06 12.172C-2.86102e-06 10.4493 0.305997 8.85129 0.917997 7.37796C1.53 5.90462 2.38 4.61262 3.468 3.50196C4.556 2.39129 5.82533 1.52996 7.276 0.917956C8.72666 0.305955 10.302 -4.47035e-05 12.002 -4.47035e-05C13.158 -4.47035e-05 14.28 0.169956 15.368 0.509957C16.456 0.849957 17.4533 1.32596 18.36 1.93796C19.2667 2.52729 20.026 3.21862 20.638 4.01196L17.816 7.10596C17.2267 6.49396 16.6147 5.98396 15.98 5.57596C15.368 5.14529 14.722 4.82796 14.042 4.62396C13.3847 4.39729 12.7047 4.28396 12.002 4.28396C10.9593 4.28396 9.97333 4.47662 9.044 4.86196C8.13733 5.24729 7.344 5.79129 6.664 6.49396C6.00666 7.19662 5.48533 8.03529 5.1 9.00996C4.71466 9.96196 4.522 11.0273 4.522 12.206C4.522 13.4073 4.70333 14.4953 5.066 15.47C5.45133 16.4446 5.984 17.2833 6.664 17.986C7.36666 18.6886 8.194 19.2326 9.146 19.618C10.1207 19.9806 11.186 20.162 12.342 20.162C13.09 20.162 13.8153 20.06 14.518 19.856C15.2207 19.652 15.8667 19.3686 16.456 19.006C17.068 18.6206 17.6233 18.1786 18.122 17.68L20.298 21.182C19.754 21.794 19.0287 22.3493 18.122 22.848C17.2153 23.3466 16.1953 23.7433 15.062 24.038C13.9513 24.31 12.8407 24.446 11.73 24.446ZM34.3942 24.31C32.5129 24.31 30.8355 23.9133 29.3622 23.12C27.8889 22.304 26.7215 21.1933 25.8602 19.788C25.0215 18.36 24.6022 16.7506 24.6022 14.96V0.271956H29.0562V14.654C29.0562 15.7193 29.2942 16.6713 29.7702 17.51C30.2689 18.326 30.9262 18.9833 31.7422 19.482C32.5582 19.9806 33.4422 20.23 34.3942 20.23C35.4369 20.23 36.3775 19.9806 37.2162 19.482C38.0549 18.9833 38.7122 18.326 39.1882 17.51C39.6869 16.6713 39.9362 15.7193 39.9362 14.654V0.271956H44.2202V14.96C44.2202 16.7506 43.7895 18.36 42.9282 19.788C42.0895 21.1933 40.9335 22.304 39.4602 23.12C37.9869 23.9133 36.2982 24.31 34.3942 24.31ZM50.341 24.106V0.305955H60.677C62.105 0.305955 63.4083 0.645956 64.587 1.32596C65.7656 1.98329 66.695 2.88996 67.375 4.04596C68.0776 5.17929 68.429 6.45996 68.429 7.88796C68.429 9.24796 68.0776 10.506 67.375 11.662C66.695 12.7953 65.7656 13.702 64.587 14.382C63.431 15.0393 62.1276 15.368 60.677 15.368H54.659V24.106H50.341ZM64.145 24.106L58.093 13.362L62.649 12.512L69.381 24.14L64.145 24.106ZM54.659 11.526H60.711C61.3683 11.526 61.935 11.3786 62.411 11.084C62.9096 10.7666 63.295 10.336 63.567 9.79196C63.839 9.24796 63.975 8.64729 63.975 7.98996C63.975 7.24196 63.805 6.59596 63.465 6.05196C63.125 5.50796 62.649 5.07729 62.037 4.75996C61.425 4.44262 60.7223 4.28396 59.929 4.28396H54.659V11.526ZM71.396 24.106L80.678 0.305955H84.826L94.04 24.106H89.45L84.35 10.574C84.2367 10.302 84.078 9.87129 83.874 9.28196C83.6927 8.69262 83.4887 8.05796 83.262 7.37796C83.0353 6.67529 82.8313 6.02929 82.65 5.43996C82.4687 4.82796 82.3327 4.38596 82.242 4.11396L83.092 4.07996C82.956 4.53329 82.7973 5.04329 82.616 5.60996C82.4347 6.17662 82.242 6.76596 82.038 7.37796C81.834 7.98996 81.63 8.57929 81.426 9.14596C81.2447 9.71262 81.0747 10.2226 80.916 10.676L75.816 24.106H71.396ZM75.612 18.666L77.142 14.824H87.988L89.62 18.666H75.612ZM100.855 24.106V4.38596H94.0549V0.305955H112.279V4.38596H105.275V24.106H100.855Z" fill="black"/>
</svg>`;

export default function Splash() {
  const router = useRouter();
  const pathname = usePathname();

  /** 데이터 및 로직 */
  const { user, initialize, initialized } = useAuth();
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const gallery = useOnboardingStore((s) => s.gallery);
  const hasNavigated = useRef(false);

  /** 애니메이션 값 */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  /** Auth 초기화 */
  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  /** 우아한 페이드인 애니메이션 */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /** 라우팅 로직 - 간소화 */
  useEffect(() => {
    if (!pathname?.includes("/splash")) return;
    if (!initialized || hasNavigated.current) return;
    
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      // 온보딩 완료 여부 확인: user 또는 (age && aesthetic && gallery)
      const isOnboardingComplete = user || (age && aesthetic && gallery);
      
      if (isOnboardingComplete) {
        router.replace("/(tabs)");
      } else {
        // 통합 온보딩 페이지로 이동
        router.replace("/(onboarding)/onboarding");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [initialized, user, age, aesthetic, gallery, pathname, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.Text style={styles.subtitle}>
          당신의 AI 도슨트,
        </Animated.Text>
        
        <View style={styles.logoContainer}>
          <SvgXml xml={LOGO_SVG} width={226} height={50} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 16,
    letterSpacing: 0.5,
    alignSelf:"flex-start"
  },
  logoContainer: {
    alignSelf: "flex-start",
  },
});