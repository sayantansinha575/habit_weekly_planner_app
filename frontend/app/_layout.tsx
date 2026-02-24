import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { notificationUtils } from "@/src/utils/notifications";
import * as Notifications from "expo-notifications";
import { supabase } from "@/src/services/supabase";
import { useTaskStore } from "@/src/store/useTaskStore";
import { authService } from "@/src/services/authService";

// Handle notifications when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import useColorScheme from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const setSession = useTaskStore((state) => state.setSession);
  const setIsAuthReady = useTaskStore((state) => state.setIsAuthReady);

  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // useEffect(() => {
  //   // 1. Initial Session Check
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setSession(session).finally(() => {
  //       setIsAuthReady(true);
  //     });
  //   });

  //   // 2. Auth State Listener
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setSession(session).finally(() => {
  //       setIsAuthReady(true);
  //     });
  //   });

  //   return () => subscription.unsubscribe();
  // }, []);

  useEffect(() => {
    // 1. Initial Session Check (Standard Supabase)
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await setSession(session);
    };

    init();

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      notificationUtils.requestPermissions();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    // Keep rendering Slot to prevent navigation errors,
    // SplashScreen hides only in the useEffect above.
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
