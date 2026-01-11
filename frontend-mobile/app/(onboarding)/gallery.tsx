import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { fetchGalleries, Gallery } from "@/services/gallery";
import { useAuth } from "@/store/auth.store";

export default function GalleryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const setGallery = useOnboardingStore((s) => s.setGallery);
  const selectedGallery = useOnboardingStore((s) => s.gallery);
  const age = useOnboardingStore((s) => s.age);
  const aesthetic = useOnboardingStore((s) => s.aesthetic);
  const pathname = usePathname();
  
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only redirect when this onboarding gallery screen is active.
    if (!pathname?.includes("/gallery")) return;
    if (!user && (!age || !aesthetic)) {
      router.replace("/(onboarding)/age");
    }
  }, [user, age, aesthetic, router, pathname]);

  useEffect(() => {
    async function loadGalleries() {
      try {
        setLoading(true);
        const data = await fetchGalleries();
        setGalleries(data);
      } catch (err) {
        console.error("갤러리 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGalleries();
  }, []);

  const handleSelectGallery = (galleryId: number) => {
    setGallery(galleryId);
    router.replace("/(tabs)");
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => {
            // Clear gallery when going back to allow re-selection
            setGallery(undefined);
            router.replace("/(onboarding)/aesthetic");
          }}
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
          갤러리를 선택해주세요
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
          관람하고 싶은 갤러리를 선택하세요
        </Text>

        <View style={{ gap: 12 }}>
          {galleries.map((gallery) => {
            const isSelected = selectedGallery === gallery.id;
            return (
              <Pressable
                key={gallery.id}
                onPress={() => handleSelectGallery(gallery.id)}
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
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: isSelected ? "600" : "500",
                        color: isSelected ? "#007AFF" : "#1a1a1a",
                        marginBottom: 4,
                      }}
                    >
                      {gallery.name}
                    </Text>
                    {gallery.location && (
                      <Text style={{ fontSize: 14, color: "#666" }}>
                        {gallery.location}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color="#007AFF" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
