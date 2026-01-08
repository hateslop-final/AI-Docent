import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: 16 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>설정</Text>
        </View>

        {/* 설정 목록 */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ gap: 12 }}>
            {/* 알림 설정 */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                  알림 받기
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  푸시 알림을 받습니다
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#e5e5e5", true: "#007AFF" }}
              />
            </View>

            {/* 다크 모드 */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                  다크 모드
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  어두운 테마를 사용합니다
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#e5e5e5", true: "#007AFF" }}
              />
            </View>

            {/* 정보 */}
            <View style={{
              padding: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
              marginTop: 8,
            }}>
              <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                AI Docent v1.0.0
              </Text>
            </View>

            {/* 회원 탈퇴 */}
            <Pressable
              style={{
                marginTop: 16,
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
              onPress={() => router.push("/mypage/withdraw")}
            >
              <Text style={{ color: "#d00", fontSize: 15, fontWeight: "700" }}>
                회원 탈퇴
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
