import Purchases, { PurchasesOffering } from "react-native-purchases";
import { Platform } from "react-native";

const API_KEY_ANDROID = "test_PneAYDxdnVJwDLVpBkMHblIBETW";

export const iapService = {
  configure: async (userId: string) => {
    try {
      if (Platform.OS === "android") {
        Purchases.configure({ apiKey: API_KEY_ANDROID, appUserID: userId });
      }
      // Add iOS config if needed in future
    } catch (e) {
      console.error("RevenueCat Configuration Error:", e);
    }
  },

  getOfferings: async (): Promise<PurchasesOffering | null> => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current;
      }
      return null;
    } catch (e) {
      console.error("Error fetching offerings:", e);
      return null;
    }
  },

  purchasePackage: async (pkg: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase Error:", e);
      }
      throw e;
    }
  },

  getCustomerInfo: async () => {
    try {
      return await Purchases.getCustomerInfo();
    } catch (e) {
      console.error("Error fetching customer info:", e);
      return null;
    }
  },

  getPackageMetadata: (pkg: any) => {
    const type = pkg.packageType;
    switch (type) {
      case "MONTHLY":
        return {
          title: "Monthly",
          badge: null,
          icon: "Zap",
          description: "Perfect for getting started",
        };
      case "ANNUAL":
        return {
          title: "Yearly",
          badge: "Best Value",
          icon: "Crown",
          description: "Save 40% annually",
        };
      case "LIFETIME":
        return {
          title: "Lifetime",
          badge: "One-Time",
          icon: "Diamond",
          description: "Pay once, keep forever",
        };
      default:
        return {
          title: "Pro",
          badge: null,
          icon: "Star",
          description: "Full access",
        };
    }
  },
};
