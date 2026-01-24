import { View, Text, Pressable, ScrollView, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { fetchGalleries, Gallery } from "@/services/gallery";

// 무채색 컬러 테마
const THEME = {
  primary: "#1a1a1a",        // 다크 그레이/블랙
  primaryLight: "#f5f5f5",   // 연한 그레이 배경
  border: "#e0e0e0",         // 보더 (비활성 인디케이터)
  borderSelected: "#4a4a4a", // 선택된 항목 보더 (부드러운 다크 그레이)
  background: "#fafafa",     // 화면 배경색 (살짝 어두운 회색)
  cardBackground: "#ffffff", // 카드 배경색 (순백)
  text: "#1a1a1a",           // 텍스트
  textSecondary: "#666",     // 보조 텍스트
};

// Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 3,
            backgroundColor: index < currentStep ? THEME.primary : THEME.border,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

// Step 1: Age Selection
const AGE_OPTIONS = [
  { label: "청소년", value: "teen" },
  { label: "성인", value: "adult" },
];

// Step 2: Aesthetic Selection
const AESTHETIC_OPTIONS = [
  { key: "light", title: "가볍게", desc: "편하게 감상하고 싶어요", icon: "light-mode" },
  { key: "medium", title: "적당히", desc: "배경이 궁금해요", icon: "auto-awesome" },
  { key: "deep", title: "깊이 있게", desc: "맥락까지 알고 싶어요", icon: "menu-book" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loadingGalleries, setLoadingGalleries] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const age = useOnboardingStore((s) => s.age);
  const setAge = useOnboardingStore((s) => s.setAge);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const setAesthetic = useOnboardingStore((s) => s.setAesthetic);
  const gallery = useOnboardingStore((s) => s.gallery);
  const setGallery = useOnboardingStore((s) => s.setGallery);

  // Load galleries when reaching step 3
  useEffect(() => {
    if (currentStep === 3) {
      console.log("🔍 Step 3 도달 - 갤러리 로딩 시작");
      console.log("환경 변수 체크:");
      console.log("- EXPO_PUBLIC_SUPABASE_URL:", process.env.EXPO_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 없음");
      console.log("- EXPO_PUBLIC_SUPABASE_ANON_KEY:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 없음");
      
      // fadeAnim을 즉시 1로 리셋 (opacity 문제 해결)
      fadeAnim.setValue(1);
      
      loadGalleries();
    }
  }, [currentStep, fadeAnim]);

  console.log(currentStep);

  const loadGalleries = async () => {
    try {
      setLoadingGalleries(true);
      console.log("📍 Step 3: 갤러리 로딩 시작...");
      const data = await fetchGalleries();
      console.log("✅ 갤러리 로딩 성공:", data?.length, "개");
      setGalleries(data);
    } catch (err: any) {
      console.error("❌ 갤러리 로드 실패:", err);
      console.error("에러 메시지:", err?.message);
      console.error("에러 스택:", err?.stack);
      
      // 사용자에게 에러 표시 (빈 배열 대신 더미 데이터 또는 에러 상태 설정)
      setGalleries([]);
    } finally {
      setLoadingGalleries(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      // Step 1에서는 splash 화면으로 안전하게 이동
      router.replace("/(onboarding)/splash");
    } else {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Move to previous step
        setCurrentStep(prev => prev - 1);
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleAgeSelect = (value: string) => {
    setAge(value);
    // Fade out and transition to step 2
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(2);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleAestheticSelect = (value: string) => {
    setAesthetic(value);
    // Fade out and transition to step 3
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(3);
      // Step 3는 fadeAnim이 useEffect에서 1로 리셋됨
    });
  };

  const handleGallerySelect = (galleryId: number) => {
    setGallery(galleryId);
    router.replace("/(tabs)");
  };

  const renderStepContent = () => {
    console.log("🎨 renderStepContent 호출 - currentStep:", currentStep);
    console.log("📊 galleries 상태:", galleries.length, "개");
    console.log("⏳ loadingGalleries:", loadingGalleries);

    if (currentStep === 1) {
      console.log("✅ Step 1 렌더링");
      // Step 1: Age Selection
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 8,
              color: "#1a1a1a",
            }}
          >
            연령대를 선택해주세요
          </Text>
          <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
            맞춤형 안내를 위해 필요해요
          </Text>

          <View style={{ gap: 12 }}>
            {AGE_OPTIONS.map((option) => {
              const isSelected = age === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleAgeSelect(option.value)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? THEME.borderSelected : "transparent",
                    backgroundColor: isSelected ? THEME.primaryLight : THEME.cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: isSelected ? "600" : "500",
                      color: isSelected ? THEME.primary : THEME.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      );
    } else if (currentStep === 2) {
      console.log("✅ Step 2 렌더링");
      // Step 2: Aesthetic Selection
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 8,
              color: "#1a1a1a",
            }}
          >
            어떻게 안내해드릴까요?
          </Text>
          <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
            원하시는 설명 수준을 선택해주세요
          </Text>

          <View style={{ gap: 16 }}>
            {AESTHETIC_OPTIONS.map((option) => {
              const isSelected = aesthetic === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleAestheticSelect(option.key)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 24,
                    borderRadius: 20,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? THEME.borderSelected : "transparent",
                    backgroundColor: isSelected ? THEME.primaryLight : THEME.cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialIcons
                      name={option.icon as any}
                      size={28}
                      color={isSelected ? THEME.primary : THEME.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: isSelected ? "700" : "600",
                        color: isSelected ? THEME.primary : THEME.text,
                      }}
                    >
                      {option.title}
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginLeft: 40,
                      fontSize: 15,
                      color: isSelected ? THEME.primary : THEME.textSecondary,
                      lineHeight: 22,
                    }}
                  >
                    {option.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      );
    } else if (currentStep === 3) {
      console.log("✅ Step 3 렌더링 시작");
      console.log("   - loadingGalleries:", loadingGalleries);
      console.log("   - galleries.length:", galleries.length);
      
      // Step 3: Gallery Selection
      if (loadingGalleries) {
        console.log("   → 로딩 중 UI 렌더링");
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 100 }}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={{ marginTop: 16, color: THEME.textSecondary }}>갤러리 목록을 불러오는 중...</Text>
          </View>
        );
      }

      // 갤러리가 없을 경우
      if (galleries.length === 0) {
        console.log("   → 갤러리 0개 - 에러 UI 렌더링");
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                marginBottom: 8,
                color: "#1a1a1a",
              }}
            >
              갤러리를 선택해주세요
            </Text>
            <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
              관람하고 싶은 갤러리를 선택하세요
            </Text>

            <View style={{ 
              padding: 40, 
              alignItems: "center",
              backgroundColor: THEME.cardBackground,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <Text style={{ fontSize: 16, color: THEME.textSecondary, textAlign: "center" }}>
                갤러리 목록을 불러올 수 없습니다.{"\n"}
                네트워크 연결을 확인해주세요.
              </Text>
              <Pressable
                onPress={loadGalleries}
                style={{
                  marginTop: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  backgroundColor: THEME.primary,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        );
      }

      console.log("   → 갤러리 목록 렌더링:", galleries.length, "개");
      console.log("   → galleries 데이터:", JSON.stringify(galleries, null, 2));
      
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 8,
              color: "#1a1a1a",
            }}
          >
            갤러리를 선택해주세요
          </Text>
          <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
            관람하고 싶은 갤러리를 선택하세요
          </Text>

          <View style={{ gap: 12 }}>
            {galleries.map((galleryItem, index) => {
              console.log(`   → 갤러리 카드 렌더링 [${index}]:`, galleryItem.name);
              const isSelected = gallery === galleryItem.id;
              return (
                <Pressable
                  key={galleryItem.id}
                  onPress={() => handleGallerySelect(galleryItem.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? THEME.borderSelected : "transparent",
                    backgroundColor: isSelected ? THEME.primaryLight : THEME.cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: isSelected ? "600" : "500",
                          color: isSelected ? THEME.primary : THEME.text,
                          marginBottom: 4,
                        }}
                      >
                        {galleryItem.name}
                      </Text>
                      {galleryItem.location && (
                        <Text style={{ fontSize: 14, color: THEME.textSecondary }}>
                          {galleryItem.location}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={24} color={THEME.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed Header: Back Button + Progress Indicator */}
        <Pressable
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            paddingVertical: 8,
            paddingHorizontal: 4,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          <Text style={{ marginLeft: 8, fontSize: 16, color: "#1a1a1a" }}>이전</Text>
        </Pressable>

        <ProgressIndicator currentStep={currentStep} totalSteps={3} />

        {/* Dynamic Step Content */}
        {renderStepContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
