import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function FeaturesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }} edges={["top"]}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
        backgroundColor: "#fff",
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }}>
          앱 기능 안내
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 16 }}>
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#E3F2FD",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}>
                <MaterialIcons name="camera-alt" size={24} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                  작품 사진으로 질문하기
                </Text>
                <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                  전시장에서 작품을 촬영하면 AI가 작품 정보와 설명을 제공해요
                </Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#E3F2FD",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}>
                <MaterialIcons name="chat" size={24} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                  AI 도슨트와 대화하기
                </Text>
                <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                  작품, 작가, 배경 등 궁금한 점을 자유롭게 질문해보세요
                </Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#E3F2FD",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}>
                <MaterialIcons name="save" size={24} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                  대화 기록 저장
                </Text>
                <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                  로그인하면 대화 기록을 저장하고 나중에 다시 볼 수 있어요
                </Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#E3F2FD",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}>
                <MaterialIcons name="tune" size={24} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}>
                  맞춤형 설명
                </Text>
                <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                  연령대와 설명 수준을 설정하여 나에게 맞는 설명을 받을 수 있어요
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
