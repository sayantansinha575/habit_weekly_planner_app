import { Tabs, useRouter, useRootNavigationState } from "expo-router";
import React, { useEffect } from "react";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";
import {
  LayoutDashboard,
  Calendar,
  Layers,
  BarChart2,
  Apple,
} from "lucide-react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors, Fonts } from "@/src/theme/colors";
import useColorScheme from "@/hooks/use-color-scheme";
import { useTaskStore } from "@/src/store/useTaskStore";
import { iapService } from "@/src/services/iapService";

// const fetchCustomer = async () => {
//   const customerInfo = await iapService.getCustomerInfo();
//   console.log("Customer Info:", customerInfo);
// };

// fetchCustomer();

export default function TabLayout() {
  // try {
  //   const customerInfo =  iapService.getCustomerInfo();
  //   console.log("Customer Info:", customerInfo);
  //   // access latest customerInfo
  // } catch (e) {
  //   console.error("Error fetching customer info:", e);
  //   // Error fetching customer info
  // }

  const colorScheme = useColorScheme();
  const router = useRouter();
  const session = useTaskStore((state) => state.session);
  const isAuthReady = useTaskStore((state) => state.isAuthReady);
  const checkTrialStatus = useTaskStore((state) => state.checkTrialStatus);
  const rootNavigationState = useRootNavigationState();

  // Global auth redirection is now handled in RootLayout

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 11,
          fontFamily: Fonts.semiBold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calorie"
        options={{
          title: "Calorie Ai",
          tabBarIcon: ({ color, size }) => <Apple color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: "Templates",
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
