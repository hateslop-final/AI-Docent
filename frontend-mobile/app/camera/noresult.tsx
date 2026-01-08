import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Artwork, fetchArtworksByExhibition, searchArtworksByTitleOrArtist } from "@/services/artwork";
import { fetchExhibitionById } from "@/services/exhibition";
import { useState, useEffect } from "react";

export default function NoResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exhibitionId?: string }>();
  const exhibitionId = params.exhibitionId ? parseInt(params.exhibitionId, 10) : null;
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitionName, setExhibitionName] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (exhibitionId === null || Number.isNaN(exhibitionId)) return;
    fetchExhibitionById(exhibitionId).then((ex) => {
      if (ex?.name) setExhibitionName(ex.name);
    });
    fetchArtworksByExhibition(exhibitionId).then(setArtworks);
  }, [exhibitionId]);

  // 실시간 검색: query가 변경될 때마다 자동으로 검색
  useEffect(() => {
    if (exhibitionId === null || Number.isNaN(exhibitionId)) return;
    
    const trimmed = query.trim();
    
    // 디바운싱: 300ms 후에 검색 실행
    const timeoutId = setTimeout(async () => {
      if (!trimmed) {
        // 검색어가 비어있으면 전체 목록 표시
        const list = await fetchArtworksByExhibition(exhibitionId);
        setArtworks(list);
      } else {
        // 검색어가 있으면 검색 실행
        const list = await searchArtworksByTitleOrArtist({ exhibitionId, query: trimmed });
        setArtworks(list);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, exhibitionId]);

  const handleSearch = async () => {
    if (exhibitionId === null || Number.isNaN(exhibitionId)) return;
    const trimmed = query.trim();
    if (!trimmed) {
      const list = await fetchArtworksByExhibition(exhibitionId);
      setArtworks(list);
      return;
    }
    const list = await searchArtworksByTitleOrArtist({ exhibitionId, query: trimmed });
    setArtworks(list);
  };

  return (
    <SafeAreaView style={styles.safe}>
    <ScrollView>
      <View style={styles.container}>
        {exhibitionName ? (
          <Text style={styles.exhibitionTitle}>{exhibitionName}</Text>
        ) : null}

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="작품바명 / 작가 이름으로 검색"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </Pressable>
        </View>

        {exhibitionId === null ? (
          <Text style={styles.emptyText}>전시 정보가 없습니다.</Text>
        ) : artworks.length === 0 ? (
          <Text style={styles.emptyText}>이 전시에는 아직 등록된 작품이 없습니다.</Text>
        ) : (
          <View style={styles.grid}>
            {artworks.map((artwork) => (
              <Pressable
                key={artwork.id}
                style={styles.card}
                onPress={() =>
                  router.replace({
                    pathname: "/(tabs)/chat",
                    params: {
                      artworkId: artwork.id,
                      artworkTitle: artwork.title,
                      artworkArtist: artwork.artist,
                      artworkImage: artwork.image_url || "",
                      artworkYear: artwork.production_year || "",
                    },
                  })
                }
              >
                {artwork.image_url ? (
                  <Image source={{ uri: artwork.image_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <Text style={styles.artTitle} numberOfLines={1}>
                  {artwork.title}
                </Text>
                <Text style={styles.artMeta} numberOfLines={1}>
                  {artwork.artist || "작가 정보 없음"}
                  {artwork.production_year ? ` · ${artwork.production_year}` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable
          style={styles.secondary}
          onPress={() => router.replace("/(tabs)/chat")}>
          <Text style={styles.secondaryText}>원하는 작품이 없어요</Text>
        </Pressable>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  exhibitionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  primary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondary: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0d7de",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  thumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#888",
  },
  artTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  artMeta: {
    fontSize: 13,
    color: "#666",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    textAlign: "center",
  },
});