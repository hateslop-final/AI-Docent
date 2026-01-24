import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsState = {
  notificationsEnabled: boolean;
  darkMode: boolean;
  initialized: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  initialize: () => Promise<void>;
};

const STORAGE_KEYS = {
  NOTIFICATIONS: "settings.notifications",
  DARK_MODE: "settings.darkMode",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notificationsEnabled: true,
  darkMode: false,
  initialized: false,
  
  initialize: async () => {
    try {
      const [notifications, darkMode] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
      ]);

      set({
        notificationsEnabled: notifications !== null ? JSON.parse(notifications) : true,
        darkMode: darkMode !== null ? JSON.parse(darkMode) : false,
        initialized: true,
      });
    } catch (error) {
      console.error("[SettingsStore] 초기화 에러:", error);
      set({ initialized: true });
    }
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(enabled));
      set({ notificationsEnabled: enabled });
    } catch (error) {
      console.error("[SettingsStore] 알림 설정 저장 에러:", error);
    }
  },

  setDarkMode: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(enabled));
      set({ darkMode: enabled });
    } catch (error) {
      console.error("[SettingsStore] 다크모드 설정 저장 에러:", error);
    }
  },
}));
