import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getSession, signOut, withdrawAccount } from "@/services/auth";

export default function WithdrawScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    Alert.alert(
      "정말 탈퇴하시겠어요?",
      "탈퇴하면 저장된 프로필과 기록이 모두 삭제됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const session = await getSession();
              const token = session?.access_token;
              if (!token) {
                throw new Error("로그인 정보가 없습니다.");
              }
              await withdrawAccount(token);
              await signOut();
              Alert.alert("탈퇴 완료", "그동안 이용해 주셔서 감사합니다.");
              router.replace("/mypage/login");
            } catch (error: any) {
              Alert.alert("탈퇴 실패", error?.message || "잠시 후 다시 시도해 주세요.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e5e5",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: 16 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>회원 탈퇴</Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              탈퇴 전에 확인해 주세요
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 20 }}>
              - AI Docent 내 프로필 및 이용 기록이 삭제됩니다.
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 20 }}>
              - 삭제된 데이터는 복구할 수 없습니다.
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: "#ffe5e5",
                borderWidth: 1,
                borderColor: "#ffcccc",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={handleWithdraw}
              disabled={loading}
            >
              {loading && <ActivityIndicator size="small" color="#d00" />}
              <Text style={{ color: "#d00", fontSize: 15, fontWeight: "700" }}>
                정말 탈퇴할게요
              </Text>
            </Pressable>

            <Pressable
              style={{
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e5e5",
              }}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={{ color: "#333", fontSize: 15, fontWeight: "500" }}>
                계속 사용할래요
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

