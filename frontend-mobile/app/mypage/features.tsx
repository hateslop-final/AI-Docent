import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable } from "react-native";

export default function FeaturesScreen() {
  const router = useRouter();

  const features = [
    {
      icon: "camera-alt",
      title: "작품 촬영",
      description: "전시장에서 작품을 촬영하면 AI 도슨트가 작품에 대해 설명해드립니다.",
    },
    {
      icon: "chat",
      title: "AI 채팅",
      description: "작품에 대해 궁금한 점을 자유롭게 질문하고 대화할 수 있습니다.",
    },
    {
      icon: "person",
      title: "맞춤형 설명",
      description: "연령대와 설명 수준을 선택하여 나에게 맞는 설명을 받을 수 있습니다.",
    },
    {
      icon: "history",
      title: "대화 기록",
      description: "로그인하면 대화 기록을 저장하고 나중에 다시 볼 수 있습니다.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>앱 기능 안내</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={feature.icon as any} size={32} color="#007AFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
