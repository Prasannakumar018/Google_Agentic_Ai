import { ThemeProviderCustom, useThemeMode } from "@/components/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SafeAreaView } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProviderCustom>
      <RootLayoutWithTheme />
    </ThemeProviderCustom>
  );
}

function RootLayoutWithTheme() {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";
  return (
    <GluestackUIProvider mode={mode}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="interests" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          {/* <Button
            onPress={toggleTheme}
            style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
          >
            <ButtonText>Theme</ButtonText>
          </Button> */}
        </SafeAreaView>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
