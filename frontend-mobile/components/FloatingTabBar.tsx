import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/components/ThemeProvider";

interface TabItem {
  name: string;
  label: string;
  route: string;
  icon: (isActive: boolean) => React.ReactNode;
}

export default function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  const path = pathname || "";

  const getCurrentRoute = (): string => {
    if (path.includes("/mypage")) return "mypage";
    if (path.includes("/chat")) return "chat";
    if (
      path.includes("/(tabs)") ||
      path === "/(tabs)" ||
      path === "/(tabs)/" ||
      path === "/(tabs)/index"
    )
      return "index";
    return "index";
  };

  const currentRoute = getCurrentRoute();

  const tabs: TabItem[] = [
    {
      name: "index",
      label: "홈",
      route: "/(tabs)",
      icon: (isActive) => (
        <IconSymbol
          size={24}
          name="house.fill"
          color={isActive ? colors.primary : colors.textSecondary}
        />
      ),
    },
    {
      name: "chat",
      label: "채팅",
      route: "/(tabs)/chat",
      icon: (isActive) => (
        <MaterialIcons
          name="chat"
          size={24}
          color={isActive ? colors.primary : colors.textSecondary}
        />
      ),
    },
    {
      name: "mypage",
      label: "마이페이지",
      route: "/(tabs)/mypage",
      icon: (isActive) => (
        <MaterialIcons
          name="person"
          size={24}
          color={isActive ? colors.primary : colors.textSecondary}
        />
      ),
    },
  ];

  const handlePress = (tab: TabItem) => {
    if (currentRoute !== tab.name) {
      router[tab.name === "index" ? "replace" : "push"](tab.route as any);
    }
  };

  const styles = FloatingTabBarStyles(colors);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <View style={styles.wrapper}>
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.name;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.item}
              onPress={() => handlePress(tab)}
              activeOpacity={0.6}
            >
              {tab.icon(isActive)}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? "600" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const FloatingTabBarStyles = (colors: any) => StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 16,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
