import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useEffect } from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const OPTIONS = [
  { key: "light", title: "가볍게", desc: "편하게 감상하고 싶어요", icon: "light-mode" },
  { key: "medium", title: "적당히", desc: "배경이 궁금해요", icon: "auto-awesome" },
  { key: "deep", title: "깊이 있게", desc: "맥락까지 알고 싶어요", icon: "menu-book" },
];

export default function Aesthetic() {
  const router = useRouter();
  const setLevel = useOnboardingStore((s) => s.setAesthetic);
  const selectedLevel = useOnboardingStore((s) => s.aesthetic);
  const age = useOnboardingStore((s) => s.age);
  const gallery = useOnboardingStore((s) => s.gallery);
  const pathname = usePathname();

  useEffect(() => {
    // Only run redirect logic when this screen is active to avoid reacting to global
    // store changes triggered from other screens/components (e.g., header).
    if (!pathname?.includes("/aesthetic")) return;

    if (!age) {
      router.replace("/(onboarding)/age");
    } else if (gallery) {
      router.replace("/(tabs)");
    } else if (selectedLevel) {
      router.replace("/(onboarding)/gallery");
    }
  }, [age, selectedLevel, gallery, router, pathname]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 32,
            paddingVertical: 8,
            paddingHorizontal: 4,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          <Text style={{ marginLeft: 8, fontSize: 16, color: "#1a1a1a" }}>이전</Text>
        </Pressable>

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
          {OPTIONS.map((o) => {
            const isSelected = selectedLevel === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  setLevel(o.key);
                  router.push("/(onboarding)/gallery");
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? "#007AFF" : "#e5e5e5",
                  backgroundColor: isSelected ? "#F0F8FF" : "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <MaterialIcons
                    name={o.icon as any}
                    size={28}
                    color={isSelected ? "#007AFF" : "#666"}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: isSelected ? "700" : "600",
                      color: isSelected ? "#007AFF" : "#1a1a1a",
                    }}
                  >
                    {o.title}
                  </Text>
                </View>
                <Text
                  style={{
                    marginLeft: 40,
                    fontSize: 15,
                    color: isSelected ? "#007AFF" : "#666",
                    lineHeight: 22,
                  }}
                >
                  {o.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}