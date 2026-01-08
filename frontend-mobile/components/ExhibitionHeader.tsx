import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/store/onboarding.store";
import { fetchGalleries, Gallery } from "@/services/gallery";
import { fetchExhibitions, Exhibition } from "@/services/exhibition";

export default function ExhibitionHeader() {
  const galleryId = useOnboardingStore((s) => s.gallery);
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  const setGallery = useOnboardingStore((s) => s.setGallery);
  const setExhibition = useOnboardingStore((s) => s.setExhibition);
  const clearExhibition = useOnboardingStore((s) => s.clearExhibition);
  
  const [activeTab, setActiveTab] = useState<"gallery" | "exhibition">("gallery");
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(galleryId || null);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    async function loadGalleries() {
      try {
        const data = await fetchGalleries();
        setGalleries(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadGalleries();
  }, []);

  useEffect(() => {
    async function loadExhibitions() {
      if (!selectedGalleryId) {
        setExhibitions([]);
        return;
      }

      try {
        const data = await fetchExhibitions(selectedGalleryId);
        setExhibitions(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadExhibitions();
  }, [selectedGalleryId]);

  useEffect(() => {
    setSelectedGalleryId(galleryId || null);
  }, [galleryId]);

  const selectedGallery = galleries.find(g => g.id === galleryId);
  const selectedExhibition = exhibitions.find(e => e.id === exhibitionId);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
        {/* 현재 선택된 갤러리/전시 표시 */}
        <Pressable
          onPress={() => setShowList(!showList)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {selectedExhibition ? "현재 전시" : selectedGallery ? "갤러리" : "갤러리 미선택"}
            </Text>

            <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#000" }}
                numberOfLines={1}
            >
                {selectedExhibition?.name || selectedGallery?.name || "갤러리 미선택"}
            </Text>

            {selectedExhibition && (
              <Text
                  style={{ fontSize: 14, color: "#555", marginTop: 2 }}
                  numberOfLines={1}
              >
                  {selectedGallery?.name}
              </Text>
            )}
            </View>
        <Text style={{ fontSize: 20, color: "#666" }}>
          {showList ? "▲" : "▼"}
        </Text>
      </Pressable>

      {/* 선택 목록 */}
      {showList && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
          {/* 탭 */}
          <View style={{ flexDirection: "row" }}>
            <Pressable
              onPress={() => setActiveTab("gallery")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === "gallery" ? "#007AFF" : "transparent",
              }}
            >
              <Text style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: activeTab === "gallery" ? "600" : "400",
                color: activeTab === "gallery" ? "#007AFF" : "#666",
              }}>
                갤러리
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedGalleryId) {
                  setActiveTab("exhibition");
                }
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === "exhibition" ? "#007AFF" : "transparent",
                opacity: selectedGalleryId ? 1 : 0.5,
              }}
            >
              <Text style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: activeTab === "exhibition" ? "600" : "400",
                color: activeTab === "exhibition" ? "#007AFF" : "#666",
              }}>
                전시
              </Text>
            </Pressable>
          </View>

          {/* 목록 */}
          <View style={{ maxHeight: 300 }}>
            {activeTab === "gallery" && (
              <View>
                {galleries.map((gallery) => (
                  <Pressable
                    key={gallery.id}
                    onPress={() => {
                      setSelectedGalleryId(gallery.id);
                      setGallery(gallery.id);
                      // 갤러리 재선택 시 전시 선택 취소
                      if (gallery.id !== galleryId) {
                        clearExhibition();
                      }
                      setActiveTab("exhibition");
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                      backgroundColor: selectedGalleryId === gallery.id ? "#f0f7ff" : "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: selectedGalleryId === gallery.id ? "600" : "400" }}>
                      {gallery.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === "exhibition" && selectedGalleryId && (
              <View>
                {exhibitions.map((exhibition) => (
                  <Pressable
                    key={exhibition.id}
                    onPress={() => {
                      setExhibition(exhibition.id);
                      setShowList(false);
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                      backgroundColor: exhibitionId === exhibition.id ? "#f0f7ff" : "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: exhibitionId === exhibition.id ? "600" : "400" }}>
                      {exhibition.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
