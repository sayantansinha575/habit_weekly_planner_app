// Zustand store for tasks and calorie progress
import { create } from "zustand";
import { storage } from "../utils/storage";
import { notificationUtils } from "../utils/notifications";
import { api } from "../services/api";
import { iapService } from "../services/iapService";
import { authService } from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases from "react-native-purchases";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  scheduledDate: string | Date;
  scheduledTime?: string;
  isNotificationEnabled?: boolean;
  isAutoRolled?: boolean;
}

interface Stats {
  dailyStreak: number;
  weeklyStreak: number;
  completionRate: number;
  bestDay: string;
  totalTasks: number;
  completedTasks: number;
  weeklyProgress: Array<{ day: string; rate: number }>;
  rollingProgress?: Array<{ day: string; rate: number }>;
}

interface TaskState {
  tasks: Task[];
  stats: Stats | null;
  loading: boolean;
  isSyncing: boolean;

  subscriptionStatus: "FREE" | "PRO";
  isSubscriptionLoading: boolean;
  user: any;
  session: any;
  isAuthReady: boolean;
  isAuthenticating: boolean;
  isOnboarding: boolean;
  hasSeenOnboarding: boolean;
  isInitializing: boolean;

  calorieProgress: any | null;

  // Actions
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  setIsAuthReady: (ready: boolean) => void;
  setSession: (session: any) => Promise<void>;
  checkTrialStatus: () => "valid" | "expired";
  signOut: () => Promise<void>;
  loadTasks: (userId: string) => Promise<void>;
  loadStats: (userId: string) => Promise<void>;
  loadCalAiProgress: (userId: string, days: number) => Promise<void>;
  addTask: (userId: string, taskData: any) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, taskData: any) => Promise<void>;
  deleteTasks: (taskIds: string[]) => Promise<void>;
  applyTemplate: (userId: string, templateId: string) => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  setSubscriptionStatus: (status: "FREE" | "PRO") => void;
  loadSubscriptionStatus: () => Promise<void>;

  calAiProfile: any | null;
  calAiDashboard: any | null;
  hasCalAiLoaded: boolean;
  setCalAiLoaded: (value: boolean) => void;
  calAiLoading: boolean;
  setCalAiLoading: (v: boolean) => void;
  loadCalAiData: (userId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  loading: false,
  isSyncing: false,
  subscriptionStatus: "FREE",
  isSubscriptionLoading: false,
  user: null,
  session: null,
  isAuthReady: false,
  isAuthenticating: false,
  isOnboarding: false,
  hasSeenOnboarding: false,
  calorieProgress: null,
  isInitializing: true,

  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),

  // CalAI State
  hasCalAiLoaded: false,
  setCalAiLoaded: (value: boolean) => set({ hasCalAiLoaded: value }),

  calAiLoading: false,
  setCalAiLoading: (v: boolean) => set({ calAiLoading: v }),
  calAiProfile: null,
  calAiDashboard: null,

  // setSession: async (session) => {
  //   // If no session, we are ready (logged out)
  //   if (!session) {
  //     console.log("No session provided to setSession");
  //     // If we are still initializing, preserve the persisted status
  //     // (Otherwise it gets wiped to FREE before getSession and verifySupabaseAuth complete)
  //     const isInitializing = get().isInitializing;
  //     const preservedStatus = get().subscriptionStatus;

  //     set({
  //       session: null,
  //       user: null,
  //       subscriptionStatus: isInitializing ? preservedStatus : "FREE",
  //       isAuthReady: !isInitializing,
  //       isAuthenticating: false,
  //       hasCalAiLoaded: false,
  //       calAiProfile: null,
  //       calAiDashboard: null,
  //     });
  //     return;
  //   }

  //   console.log("Session found, starting verification...");
  //   set({ session, isSubscriptionLoading: true });

  //   // Verify with backend
  //   try {
  //     const { user } = await api.verifySupabaseAuth(session.access_token);

  //     const currentStatus = get().subscriptionStatus;
  //     const backendStatus =
  //       user.subscriptionStatus === "PREMIUM" ||
  //       user.subscriptionStatus === "PRO"
  //         ? "PRO"
  //         : "FREE";

  //     // STICKY PRO: If we are already PRO (from local storage), do NOT downgrade to FREE
  //     // based on backend yet. Let RevenueCat (iapService) be the final judge.
  //     const finalStatus =
  //       currentStatus === "PRO" || backendStatus === "PRO" ? "PRO" : "FREE";

  //     console.log(
  //       "Backend verification successful. Current:",
  //       currentStatus,
  //       "Backend:",
  //       backendStatus,
  //       "Final Sticky Status:",
  //       finalStatus,
  //     );

  //     set({
  //       user,
  //       subscriptionStatus: finalStatus,
  //       isAuthReady: true,
  //       isAuthenticating: false,
  //       isOnboarding: !user.hasCompletedOnboarding,
  //       isInitializing: false, // Done!
  //     });

  //     // Persist status
  //     await AsyncStorage.setItem("@subscription_status", finalStatus);

  //     // Configure RevenueCat and sync
  //     await iapService.logIn(user.id);
  //     await get().checkSubscription();
  //   } catch (e) {
  //     console.error("Session verification failed", e);
  //     set({
  //       isAuthReady: true,
  //       isAuthenticating: false,
  //       isSubscriptionLoading: false,
  //     });
  //   }
  // },

  // checkTrialStatus: () => {
  //   const { user } = get();
  //   if (!user || user.subscriptionStatus !== "TRIAL") return "valid";

  //   const now = new Date();
  //   const expiry = new Date(user.subscriptionEndDate);
  //   return now > expiry ? "expired" : "valid";
  // },

  setSession: async (session) => {
    if (!session) {
      set({
        session: null,
        user: null,
        isAuthReady: true,
        isAuthenticating: false,
        isSubscriptionLoading: false,
        // hasCalAiLoaded: false,
        // calAiProfile: null,
        // calAiDashboard: null,
      });
      return;
    }

    set({
      session,
      isSubscriptionLoading: true,
      isAuthReady: false,
    });

    try {
      const { user } = await api.verifySupabaseAuth(session.access_token);

      set({
        user,
        isInitializing: false,
      });

      // 🔥 STEP 1: LOGIN TO REVENUECAT (CRITICAL)
      const info = await iapService.logIn(user.id);

      const isPro =
        info?.entitlements?.active &&
        Object.keys(info.entitlements.active).length > 0;

      if (isPro) {
        console.log("✅ PRO restored from RevenueCat login");
        set({ subscriptionStatus: "PRO" });
        await AsyncStorage.setItem("@subscription_status", "PRO");
      } else {
        console.log("⏳ No entitlement yet, keep existing state");
      }

      // 🔥 STEP 2: DELAYED VALIDATION (prevents race condition)
      setTimeout(() => {
        get().checkSubscription();
      }, 2000);

      set({
        isAuthReady: true,
        isAuthenticating: false,
      });
    } catch (e) {
      console.error("Session verification failed", e);
      set({
        isAuthReady: true,
        isAuthenticating: false,
        isSubscriptionLoading: false,
      });
    }
  },

  checkTrialStatus: () => {
    const { user } = get();
    if (!user || user.subscriptionStatus !== "TRIAL") return "valid";

    const now = new Date();
    const expiry = new Date(user.subscriptionEndDate);

    if (now > expiry) {
      set({ subscriptionStatus: "FREE" }); // 🔥 FIX
      return "expired";
    }

    return "valid";
  },
  signOut: async () => {
    try {
      await iapService.signOut(); // RevenueCat logout
      await authService.signOut();
      // get().setSubscriptionStatus("FREE"); // This also clears AsyncStorage
      set({
        session: null,
        user: null,
        tasks: [],
        stats: null,
        hasCalAiLoaded: false,
        calAiProfile: null,
        calAiDashboard: null,
      });
    } catch (e) {
      console.error("Sign out error:", e);
    }
  },

  loadTasks: async (userId) => {
    const currentTasks = get().tasks;
    if (currentTasks.length === 0) set({ loading: true });

    try {
      const { local, sync } = await storage.fetchTasks(userId);
      set({ tasks: local, loading: false });
      const synced = await sync;
      if (synced) set({ tasks: synced });
    } catch (e) {
      console.error("Store loadTasks failed", e);
      set({ loading: false });
    }
  },

  loadStats: async (userId) => {
    try {
      const { local, sync } = await storage.getUserStats(userId);
      set({ stats: local });
      const synced = await sync;
      if (synced) set({ stats: synced });
    } catch (e) {
      console.error("Store loadStats failed", e);
    }
  },

  loadCalAiData: async (userId: string) => {
    const { calAiProfile } = get();
    if (!calAiProfile) set({ calAiLoading: true });

    try {
      const profile = await api.getCalAiProfile(userId);
      if (profile) {
        const dash = await api.getCalAiDashboard(userId);
        set({
          calAiProfile: profile,
          calAiDashboard: dash,
          calAiLoading: false,
          hasCalAiLoaded: true,
        });
      } else {
        set({
          calAiProfile: null,
          calAiDashboard: null,
          calAiLoading: false,
          hasCalAiLoaded: true,
        });
      }
    } catch (e) {
      console.error(e);
      set({ calAiLoading: false, hasCalAiLoaded: true });
    }
  },

  loadCalAiProgress: async (userId, days) => {
    try {
      const { local, sync } = await storage.getCalAiProgress(userId, days);
      const currentProgress = get().calorieProgress;
      if (local && JSON.stringify(local) !== JSON.stringify(currentProgress)) {
        set({ calorieProgress: local });
      }
      const synced = await sync;
      if (
        synced &&
        JSON.stringify(synced) !== JSON.stringify(get().calorieProgress)
      ) {
        set({ calorieProgress: synced });
      }
    } catch (e) {
      console.error("Store loadCalAiProgress failed", e);
    }
  },

  addTask: async (userId, goalData) => {
    const dateToSave =
      goalData.scheduledDate instanceof Date
        ? goalData.scheduledDate
        : new Date(goalData.scheduledDate);
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title: goalData.title,
      isCompleted: false,
      scheduledDate: dateToSave,
      scheduledTime: goalData.scheduledTime,
    };
    const previousTasks = get().tasks;
    set({ tasks: [...previousTasks, tempTask] });

    try {
      const newTask = await storage.addTask(
        userId,
        goalData.title,
        dateToSave,
        goalData.scheduledTime,
        goalData.useNotification,
      );
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? newTask : t)),
      }));
      notificationUtils.scheduleTaskNotification(newTask);
    } catch (e) {
      set({ tasks: previousTasks });
      throw e;
    }
  },

  toggleTask: async (taskId) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
    }));

    try {
      await storage.toggleTask(taskId);
      const user = get().user;
      if (user) await get().loadStats(user.id);
      const task = get().tasks.find((t) => t.id === taskId);
      if (task) notificationUtils.scheduleTaskNotification(task);
    } catch (e) {
      set({ tasks: previousTasks });
      throw e;
    }
  },

  updateTask: async (taskId, goalData) => {
    const previousTasks = get().tasks;
    const dateToSave =
      goalData.scheduledDate instanceof Date
        ? goalData.scheduledDate
        : new Date(goalData.scheduledDate);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...goalData, scheduledDate: dateToSave } : t,
      ),
    }));

    try {
      const updatedTask = await storage.updateTask(
        taskId,
        goalData.title,
        dateToSave,
        goalData.scheduledTime,
        goalData.useNotification,
      );
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
      const user = get().user;
      if (user) await get().loadStats(user.id);
      notificationUtils.scheduleTaskNotification(updatedTask);
    } catch (e) {
      set({ tasks: previousTasks });
      throw e;
    }
  },

  deleteTasks: async (taskIds) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => !taskIds.includes(t.id)),
    }));

    try {
      await storage.deleteTasks(taskIds);
      const user = get().user;
      if (user) await get().loadStats(user.id);
      taskIds.forEach((id) => notificationUtils.cancelTaskNotification(id));
    } catch (e) {
      set({ tasks: previousTasks });
      throw e;
    }
  },

  applyTemplate: async (userId, templateId) => {
    set({ loading: true });
    try {
      await storage.applyTemplate(userId, templateId);
      const { sync } = await storage.fetchTasks(userId);
      const synced = await sync;
      set({ tasks: synced, loading: false });
      await get().loadStats(userId);
    } catch (e) {
      console.error("Store applyTemplate failed", e);
      set({ loading: false });
      throw e;
    }
  },

  checkOnboardingStatus: async () => {
    try {
      const value = await AsyncStorage.getItem("@has_seen_onboarding");
      set({ hasSeenOnboarding: value === "true" });
    } catch (e) {
      console.warn("Failed to check onboarding status", e);
      set({ hasSeenOnboarding: false });
    }
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem("@has_seen_onboarding", "true");
      set({ hasSeenOnboarding: true });
    } catch (e) {
      console.warn("Failed to save onboarding status", e);
    }

    const user = get().user;
    if (user) {
      try {
        await api.updateUser(user.id, { hasCompletedOnboarding: true });
        set({
          isOnboarding: false,
          user: { ...user, hasCompletedOnboarding: true },
        });
      } catch (e) {
        console.warn("Failed to sync onboarding completion with backend", e);
      }
    } else {
      set({ isOnboarding: false });
    }
  },

  setSubscriptionStatus: (status) => {
    set({ subscriptionStatus: status });
    AsyncStorage.setItem("@subscription_status", status);
  },

  // checkSubscription: async () => {
  //   try {
  //     set({ isSubscriptionLoading: true });
  //     const info = await iapService.getCustomerInfo();
  //     console.log("RevenueCat Customer Info:", info?.entitlements?.active);
  //     const isPro = Object.keys(info?.entitlements?.active || {}).length > 0;

  //     const newStatus = isPro ? "PRO" : "FREE";
  //     const currentStatus = get().subscriptionStatus;

  //     // Only update if it's a change to avoid unnecessary re-renders
  //     if (currentStatus !== newStatus) {
  //       console.log("Subscription status updated by RevenueCat:", newStatus);
  //       set({
  //         subscriptionStatus: newStatus,
  //       });
  //       await AsyncStorage.setItem("@subscription_status", newStatus);
  //     }
  //     set({ isSubscriptionLoading: false });
  //   } catch (e) {
  //     console.error("Subscription check failed", e);
  //     set({ isSubscriptionLoading: false });
  //   }
  // },

  checkSubscription: async () => {
    try {
      set({ isSubscriptionLoading: true });

      const info = await iapService.getCustomerInfo();

      const isPro =
        info?.entitlements?.active &&
        Object.keys(info.entitlements.active).length > 0;

      const currentStatus = get().subscriptionStatus;

      // 🔥 CRITICAL: NEVER downgrade blindly
      if (currentStatus === "PRO" && !isPro) {
        console.log("🛑 Prevented PRO downgrade (RC delay)");
        set({ isSubscriptionLoading: false });
        return;
      }

      const newStatus = isPro ? "PRO" : "FREE";

      if (currentStatus !== newStatus) {
        console.log("✅ Subscription updated:", newStatus);
        set({ subscriptionStatus: newStatus });
        await AsyncStorage.setItem("@subscription_status", newStatus);
      }

      set({ isSubscriptionLoading: false });
    } catch (e) {
      console.error("Subscription check failed", e);
      set({ isSubscriptionLoading: false });
    }
  },

  // loadSubscriptionStatus: async () => {
  //   try {
  //     const status = await AsyncStorage.getItem("@subscription_status");
  //     console.log("Loaded persisted status:", status);
  //     if (status === "PRO" || status === "FREE") {
  //       set({ subscriptionStatus: status as "PRO" | "FREE" });
  //     }
  //   } catch (e) {
  //     console.error("Failed to load subscription status", e);
  //   }
  // },

  loadSubscriptionStatus: async () => {
    try {
      const status = await AsyncStorage.getItem("@subscription_status");

      if (status === "PRO") {
        console.log("⚡ Loaded PRO from storage");
        set({ subscriptionStatus: "PRO" });
      }
    } catch (e) {
      console.error("Failed to load subscription status", e);
    }
  },
}));

// Initialize RevenueCat Listener
Purchases.addCustomerInfoUpdateListener((info) => {
  console.log("RevenueCat Update Listener fired:", info.entitlements.active);
  const isPro = Object.keys(info.entitlements.active || {}).length > 0;
  const currentStatus = useTaskStore.getState().subscriptionStatus;
  const newStatus = isPro ? "PRO" : "FREE";

  if (currentStatus !== newStatus) {
    console.log(
      "RevenueCat Update: Flipped status from",
      currentStatus,
      "to",
      newStatus,
    );
    useTaskStore.getState().setSubscriptionStatus(newStatus);
  }
});
