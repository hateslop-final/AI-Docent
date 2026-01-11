import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Image, ScrollView, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type ApiResult = {
  score?: number;
  artwork?: {
    id?: string;
    title?: string;
    artist?: string;
    production_year?: string | null;
    image_url?: string | null;
  };
};

type ArtworkResult = {
  id: string;
  title: string;
  artist: string;
  year?: string;
  similarity?: number;
  image_url?: string;
};

export default function ResultScreen() {
  const router = useRouter();
  const { results, exhibitionId } = useLocalSearchParams<{ results?: string; exhibitionId?: string }>();

  const parsed: ArtworkResult[] = useMemo(() => {
    if (!results) return [];
    try {
      const data = JSON.parse(results) as ApiResult[];
      if (!Array.isArray(data)) return [];
      return data.map((item, index) => {
        const artwork = item?.artwork;
        const similarity = item?.score !== undefined ? 1 - item.score : undefined;
        return {
          id: artwork?.id ?? `unknown-${index}`,
          title: artwork?.title ?? "제목 없음",
          artist: artwork?.artist ?? "작가 정보 없음",
          year: artwork?.production_year ?? undefined,
          similarity,
          image_url: artwork?.image_url ?? undefined,
        };
      });
    } catch (error) {
      console.error("Failed to parse results", error);
      return [];
    }
  }, [results]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>이 작품과 비슷해요</Text>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {parsed.length === 0 ? (
            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push({
                  pathname: "/camera/noresult",
                  params: exhibitionId ? { exhibitionId } : {},
                })
              }
            >
              <Text style={styles.emptyText}>유사한 작품을 찾지 못했어요</Text>
            </Pressable>
          ) : (
            <>
              {parsed.map((item, index) => (
                <Pressable
                  key={`${item.id}-${index}`}
                  style={styles.card}
                  onPress={() => {
                    router.replace({
                      pathname: "/(tabs)/chat",
                      params: {
                      exhibitionId: exhibitionId ? String(exhibitionId) : undefined,
                      artworkId: item.id,
                      artworkTitle: item.title,
                      artworkArtist: item.artist,
                      artworkImage: item.image_url || "",
                      artworkYear: item.year || "",
                      artworkSimilarity:
                        item.similarity !== undefined
                          ? Math.round(item.similarity * 100).toString()
                          : "",
                      },
                    });
                  }}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                      {item.title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                      {item.artist}
                      {item.year ? ` · ${item.year}` : ""}
                    </Text>

                    {item.similarity !== undefined && (
                      <Text style={styles.similarity}>
                        유사도 {Math.round(item.similarity * 100)}%
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}

              <Pressable
                style={[styles.emptyButton, styles.emptyButtonSecondary]}
                onPress={() =>
                  router.push({
                    pathname: "/camera/noresult",
                    params: exhibitionId ? { exhibitionId } : {},
                  })
                }
              >
                <Text style={styles.emptyText}>원하는 작품이 없어요</Text>
                <Text style={styles.emptyCta}>다른 방법으로 찾기</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  listContainer: {
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    padding: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: {
    width: 82,
    height: 82,
    backgroundColor: "#eee",
    flexShrink: 0,
    borderRadius: 10,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#888",
  },
  info: {
    flex: 1,
    minWidth: 0, // 글자 줄바꿈 허용
    padding: 12,
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
    flexShrink: 1,
  },
  similarity: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyCta: {
    fontSize: 13,
    color: "#007AFF",
  },
  emptyButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyButtonSecondary: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
  },
});