import { View, Text, ScrollView, Pressable, Switch, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSettingsStore } from "@/store/settings.store";
import { useTheme } from "@/components/ThemeProvider";
import * as Notifications from "expo-notifications";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    notificationsEnabled,
    darkMode,
    initialized,
    setNotificationsEnabled,
    setDarkMode,
    initialize,
  } = useSettingsStore();

  // 초기화
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // 알림 권한 요청 및 설정
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          Alert.alert(
            "알림 권한 필요",
            "알림을 받으려면 설정에서 알림 권한을 허용해주세요.",
            [{ text: "확인" }]
          );
          return;
        }

        // 알림 토큰 가져오기 (선택사항)
        if (Platform.OS !== "web") {
          try {
            const token = await Notifications.getExpoPushTokenAsync();
            console.log("푸시 토큰:", token);
          } catch (tokenError) {
            console.warn("푸시 토큰 가져오기 실패:", tokenError);
          }
        }

        await setNotificationsEnabled(true);
      } catch (error) {
        console.error("알림 설정 에러:", error);
        Alert.alert("오류", "알림 설정 중 오류가 발생했습니다.");
      }
    } else {
      await setNotificationsEnabled(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.cardBackground,
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: 16 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>설정</Text>
        </View>

        {/* 설정 목록 */}
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ gap: 12 }}>
            {/* 알림 설정 */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, color: colors.text }}>
                  알림 받기
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  푸시 알림을 받습니다
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: "#007AFF" }}
                disabled={!initialized}
              />
            </View>

            {/* 다크 모드 */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, color: colors.text }}>
                  다크 모드
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  어두운 테마를 사용합니다
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: "#007AFF" }}
                disabled={!initialized}
              />
            </View>

            {/* 정보 */}
            <View style={{
              padding: 16,
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              marginTop: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
                AI Docent v1.0.0
              </Text>
            </View>

            {/* 회원 탈퇴 */}
            <Pressable
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: darkMode ? "#3a1a1a" : "#ffe5e5",
                borderWidth: 1,
                borderColor: darkMode ? "#5a2a2a" : "#ffcccc",
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
