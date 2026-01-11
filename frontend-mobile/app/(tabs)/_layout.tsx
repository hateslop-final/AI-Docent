import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ExhibitionHeader from '@/components/ExhibitionHeader';
import FloatingTabBar from '@/components/FloatingTabBar';
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  // DEBUG: 로그로 pathname 변화를 추적합니다 (디버깅용, 릴리스 시 제거 가능)
  React.useEffect(() => {
    console.log('[TabLayout] pathname ->', pathname);
  }, [pathname]);

  // Memoize the header so its identity is stable across renders and
  // render it above the Tabs so it remains visible like a floating bar.
  // Use createElement + `as any` to avoid strict JSX typing issues (same
  // approach used previously when placing the header in screenOptions).
  const CustomHeader = React.memo(() => React.createElement(ExhibitionHeader as any));

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Render a stable header above the Tabs so it doesn't disappear when
          tabs change or when the router swaps screens. */}
      <CustomHeader />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          // Disable the Tabs built-in header to avoid duplicate headers.
          headerShown: false,
          tabBarButton: HapticTab,
          // 기존 디자인 유지 (기본 탭 바 숨김)
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: '채팅',
            tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            title: '마이페이지',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
          }}
        />
      </Tabs>
      
      {/* ✅ 기존 디자인 유지 (플로팅 탭 바) */}
      <FloatingTabBar />
    </View>
  );
}