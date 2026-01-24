import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme, StatusBar } from "react-native";
import { useSettingsStore } from "@/store/settings.store";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    cardBackground: string;
    border: string;
    primary: string;
    primaryLight: string;
  };
}

const lightColors = {
  background: "#fafafa",
  text: "#1a1a1a",
  textSecondary: "#666",
  cardBackground: "#ffffff",
  border: "#e0e0e0",
  primary: "#1a1a1a",
  primaryLight: "#f5f5f5",
};

const darkColors = {
  background: "#121212",
  text: "#ffffff",
  textSecondary: "#b0b0b0",
  cardBackground: "#1e1e1e",
  border: "#333333",
  primary: "#ffffff",
  primaryLight: "#2a2a2a",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { darkMode, initialized, initialize } = useSettingsStore();
  const [theme, setTheme] = useState<Theme>("light");

  // 초기화
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // 다크모드 설정에 따라 테마 결정
  useEffect(() => {
    if (initialized) {
      setTheme(darkMode ? "dark" : "light");
    } else {
      // 초기화 전에는 시스템 설정 사용
      setTheme(systemColorScheme === "dark" ? "dark" : "light");
    }
  }, [darkMode, initialized, systemColorScheme]);

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
