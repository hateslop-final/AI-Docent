import { Tabs } from 'expo-router';
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

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: true,
          header: () => <ExhibitionHeader />,
          tabBarButton: HapticTab,
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
      <FloatingTabBar />
    </View>
  );
}
