import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TabItem {
  name: string;
  label: string;
  route: string;
  icon: (isActive: boolean) => React.ReactNode;
}

export default function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
          color={isActive ? colors.tint : colors.tabIconDefault}
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
          color={isActive ? colors.tint : colors.tabIconDefault}
        />
      ),
    },
    {
      name: "mypage",
      label: "마이",
      route: "/(tabs)/mypage",
      icon: (isActive) => (
        <MaterialIcons
          name="person"
          size={24}
          color={isActive ? colors.tint : colors.tabIconDefault}
        />
      ),
    },
  ];

  const handlePress = (tab: TabItem) => {
    if (currentRoute !== tab.name) {
      router[tab.name === "index" ? "replace" : "push"](tab.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
        {tabs.map((tab, index) => {
          const isActive = currentRoute === tab.name;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;

          const getBorderRadius = () => {
            if (!isActive) return { borderRadius: 20 };

            if (isFirst) {
              // 홈: 왼쪽은 플로팅 바(32), 오른쪽은 내부 아이템(20)
              return {
                borderTopLeftRadius: 32,
                borderBottomLeftRadius: 32,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
              };
            }

            if (isLast) {
              // 마이: 오른쪽은 플로팅 바(32), 왼쪽은 내부 아이템(20)
              return {
                borderTopRightRadius: 32,
                borderBottomRightRadius: 32,
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
              };
            }

            // 채팅
            return { borderRadius: 20 };
          };

          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.item,
                isActive && {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(10, 126, 164, 0.1)",
                },
                getBorderRadius(),
              ]}
              onPress={() => handlePress(tab)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive)}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.tint
                      : colors.tabIconDefault,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    pointerEvents: "box-none",
    zIndex: 1000,
  },
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 28,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,  
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12, // ✅ 항상 동일 (보정 없음)
    borderRadius: 20,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});