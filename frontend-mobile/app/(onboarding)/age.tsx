import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { SafeAreaView } from "react-native-safe-area-context";

const AGE_OPTIONS = [
  { label: "청년", value: "teen" },
  { label: "성인", value: "adult" },
] as const;

export default function Age() {
  const router = useRouter();
  const setAge = useOnboardingStore((s) => s.setAge);
  const selectedAge = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);

  useEffect(() => {
    if (selectedAge) {
      if (aesthetic) {
        router.replace("/(onboarding)/gallery" as any);
      } else {
        router.replace("/(onboarding)/aesthetic");
      }
    }
  }, [selectedAge, aesthetic, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
            const isSelected = selectedAge === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setAge(option.value);
                  router.push("/(onboarding)/aesthetic");
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                  backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: isSelected ? "600" : "500",
                    color: isSelected ? "#007AFF" : "#1a1a1a",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
