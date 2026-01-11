import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Image, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchArtworksByExhibition, Artwork } from "@/services/artwork";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PastExhibitionArtworksScreen() {
  const router = useRouter();
  const { exhibitionId } = useLocalSearchParams<{ exhibitionId?: string }>();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtworks() {
      if (!exhibitionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchArtworksByExhibition(parseInt(exhibitionId, 10));
        setArtworks(data);
      } catch (error) {
        console.error("작품 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    loadArtworks();
  }, [exhibitionId]);

  const handleArtworkSelect = (artwork: Artwork) => {
    router.replace({
      pathname: "/(tabs)/chat",
      params: {
        exhibitionId: exhibitionId ? String(exhibitionId) : undefined,
        artworkId: artwork.id,
        artworkTitle: artwork.title,
        artworkArtist: artwork.artist || "",
        artworkImage: artwork.image_url || "",
        artworkYear: artwork.production_year || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>작품 선택</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>작품을 불러오는 중...</Text>
          </View>
        ) : artworks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="image-not-supported" size={64} color="#ccc" />
            <Text style={styles.emptyText}>작품이 없습니다</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {artworks.map((artwork) => (
              <Pressable
                key={artwork.id}
                style={styles.card}
                onPress={() => handleArtworkSelect(artwork)}
              >
                {artwork.image_url ? (
                  <Image
                    source={{ uri: artwork.image_url }}
                    style={styles.image}
                  />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <MaterialIcons name="image" size={32} color="#ccc" />
                  </View>
                )}

                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                    {artwork.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                    {artwork.artist || "작가 정보 없음"}
                    {artwork.production_year ? ` · ${artwork.production_year}` : ""}
                  </Text>
                </View>

                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    backgroundColor: "#eee",
    flexShrink: 0,
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },
  meta: {
    fontSize: 13,
    color: "#666",
  },
});
