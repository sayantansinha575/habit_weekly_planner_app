import Purchases, {
  PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

const API_KEY_ANDROID = "goog_vsQYGRBUhdYHRtjDBibndSkvMLD";
const API_KEY_IOS = "appl_mjtDZYkBCfreaNVoyiKVmrAZbKR";

export const iapService = {
  configure: async () => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    try {
      const apiKey = Platform.OS === "android" ? API_KEY_ANDROID : API_KEY_IOS;
      await Purchases.configure({ apiKey });
      console.log(`RevenueCat configured for ${Platform.OS}`);
    } catch (e) {
      console.error("RevenueCat Configuration Error:", e);
    }
  },

  logIn: async (userId: string) => {
    try {
      const { customerInfo, created } = await Purchases.logIn(userId);
      console.log("RevenueCat logged in:", userId, "Created:", created);
      return customerInfo;
    } catch (e) {
      console.error("RevenueCat logIn error:", e);
      return null;
    }
  },

  getOfferings: async (): Promise<PurchasesOffering | null> => {
    try {
      const offerings = await Purchases.getOfferings();
      console.log("Offerings:", offerings);
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

  signOut: async () => {
    try {
      await Purchases.logOut();
      console.log("RevenueCat logged out");
    } catch (e) {
      console.error("RevenueCat signOut error:", e);
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
      case "WEEKLY":
        return {
          title: "Weekly",
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
      // case "LIFETIME":
      //   return {
      //     title: "Lifetime",
      //     badge: "One-Time",
      //     icon: "Diamond",
      //     description: "Pay once, keep forever",
      //   };
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
