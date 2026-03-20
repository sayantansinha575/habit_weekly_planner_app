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

  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),

  // CalAI State
  hasCalAiLoaded: false,
  setCalAiLoaded: (value: boolean) => set({ hasCalAiLoaded: value }),

  calAiLoading: false,
  setCalAiLoading: (v: boolean) => set({ calAiLoading: v }),
  calAiProfile: null,
  calAiDashboard: null,

  setSession: async (session) => {
    // If no session, we are ready (logged out)
    if (!session) {
      set({
        session: null,
        user: null,
        subscriptionStatus: "FREE",
        isAuthReady: true,
        isAuthenticating: false,
        hasCalAiLoaded: false,
        calAiProfile: null,
        calAiDashboard: null,
      });
      return;
    }

    set({ session });

    // Verify with backend
    try {
      const { user, isNewUser } = await api.verifySupabaseAuth(
        session.access_token,
      );
      console.log("User verified:", user, "isNewUser:", isNewUser);
      // Initialize subscription status from backend as a fallback
      const initialStatus =
        user.subscriptionStatus === "PREMIUM" ||
        user.subscriptionStatus === "PRO"
          ? "PRO"
          : "FREE";

      set({
        user,
        subscriptionStatus: initialStatus,
        isAuthReady: true,
        isAuthenticating: false,
        isOnboarding: !user.hasCompletedOnboarding,
      });

      // Configure RevenueCat and sync
      await iapService.configure(user.id);
      await get().checkSubscription();
    } catch (e) {
      console.error("Session verification failed", e);
      set({ isAuthReady: true, isAuthenticating: false });
    }
  },

  // checkTrialStatus: () => {
  //   const { user } = get();
  //   if (!user || user.subscriptionStatus !== "TRIAL") return "valid";

  //   const now = new Date();
  //   const expiry = new Date(user.subscriptionEndDate);
  //   return now > expiry ? "expired" : "valid";
  // },

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
      set({
        session: null,
        user: null,
        subscriptionStatus: "FREE",
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

  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

  checkSubscription: async () => {
    try {
      set({ isSubscriptionLoading: true });
      const info = await iapService.getCustomerInfo();
      console.log("Customer Info:", info);
      const isPro = Object.keys(info?.entitlements?.active || {}).length > 0;

      set({
        subscriptionStatus: isPro ? "PRO" : "FREE",
        isSubscriptionLoading: false,
      });
    } catch (e) {
      console.error("Subscription check failed", e);
      set({ isSubscriptionLoading: false });
    }
  },
}));

// Initialize RevenueCat Listener
Purchases.addCustomerInfoUpdateListener((info) => {
  const isPro = Object.keys(info.entitlements.active).length > 0;
  useTaskStore.getState().setSubscriptionStatus(isPro ? "PRO" : "FREE");
});
