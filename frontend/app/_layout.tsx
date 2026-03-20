import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Slot,
  useRouter,
  useRootNavigationState,
  useSegments,
} from "expo-router";
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
import { iapService } from "@/src/services/iapService";

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
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const setIsAuthReady = useTaskStore((state) => state.setIsAuthReady);
  const session = useTaskStore((state) => state.session);
  const hasSeenOnboarding = useTaskStore((state) => state.hasSeenOnboarding);
  const checkOnboardingStatus = useTaskStore(
    (state) => state.checkOnboardingStatus,
  );
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

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
      await useTaskStore.getState().loadSubscriptionStatus(); // Load persisted status immediately
      await checkOnboardingStatus();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        useTaskStore.setState({ isInitializing: false, isAuthReady: true });
      } else {
        await setSession(session);
      }

      // Initialize RevenueCat
      if (session?.user?.id) {
        await iapService.configure(session.user.id);
      } else {
        await iapService.configure();
      }
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
    if (!isAuthReady || !rootNavigationState?.key) return;

    if (!hasSeenOnboarding && segments[0] !== "welcome") {
      router.replace("/welcome");
      return;
    }

    const inAuthGroup =
      segments[0] !== "login" &&
      segments[0] !== "welcome" &&
      segments[0] !== "auth-callback";

    if (!session && inAuthGroup) {
      // Redirect to the login page if not authenticated
      router.replace("/login");
    } else if (
      session &&
      (segments[0] === "login" || segments[0] === "welcome")
    ) {
      // Redirect to the tabs page if authenticated
      router.replace("/(tabs)");
    }
  }, [
    session,
    isAuthReady,
    hasSeenOnboarding,
    segments,
    rootNavigationState?.key,
  ]);
  useEffect(() => {
    if ((loaded || error) && isAuthReady) {
      SplashScreen.hideAsync();
      notificationUtils.requestPermissions();
    }
  }, [loaded, error, isAuthReady]);

  if (!loaded && !error) {
    return null;
  }

  if (!isAuthReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
