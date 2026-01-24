import { Stack } from "expo-router";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </ThemeProvider>
  );
}
