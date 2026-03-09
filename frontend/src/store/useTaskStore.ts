// Zustand store for tasks and calorie progress
import { create } from "zustand";
import { storage } from "../utils/storage";
import { notificationUtils } from "../utils/notifications";
import { api } from "../services/api";
import { iapService } from "../services/iapService";
import { authService } from "../services/authService";

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

  subscriptionStatus: "FREE" | "TRIAL" | "PREMIUM";
  user: any;
  session: any;
  isAuthReady: boolean;
  isAuthenticating: boolean;
  isOnboarding: boolean;

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
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  loading: false,
  isSyncing: false,
  subscriptionStatus: "FREE",
  user: null,
  session: null,
  isAuthReady: false,
  isAuthenticating: false,
  isOnboarding: false,
  calorieProgress: null,

  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),

  setSession: async (session) => {
    // If no session, we are ready (logged out)
    if (!session) {
      set({
        session: null,
        user: null,
        subscriptionStatus: "FREE",
        isAuthReady: true,
        isAuthenticating: false,
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
      set({
        user,
        subscriptionStatus: user.subscriptionStatus,
        isAuthReady: true,
        isAuthenticating: false,
        isOnboarding: !!isNewUser,
      });

      // Configure RevenueCat
      iapService.configure(user.id);
    } catch (e) {
      console.error("Session verification failed", e);
      // Even if sync fails, we are "ready" but effectively logged out or in error state
      set({ isAuthReady: true, isAuthenticating: false });
    }
  },

  checkTrialStatus: () => {
    const { user } = get();
    if (!user || user.subscriptionStatus !== "TRIAL") return "valid";

    const now = new Date();
    const expiry = new Date(user.subscriptionEndDate);
    return now > expiry ? "expired" : "valid";
  },

  signOut: async () => {
    await authService.signOut();
    set({
      session: null,
      user: null,
      subscriptionStatus: "FREE",
      tasks: [],
      stats: null,
    });
  },

  loadTasks: async (userId) => {
    set({ loading: true });
    try {
      // 1. Local First
      const { local, sync } = await storage.fetchTasks(userId);
      set({ tasks: local, loading: false });

      // 2. Background Sync
      const synced = await sync;
      if (synced) {
        set({ tasks: synced });
      }
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
      if (synced) {
        set({ stats: synced });
      }
    } catch (e) {
      console.error("Store loadStats failed", e);
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

    // We create a temp task for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title: goalData.title,
      isCompleted: false,
      scheduledDate: dateToSave,
      scheduledTime: goalData.scheduledTime,
    };

    // 1. Optimistic Update
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

      // 2. Replace temp task with real one
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? newTask : t)),
      }));
      // 3. Ensure notification is scheduled (logic is inside storage.addTask but store can reinforce)
      notificationUtils.scheduleTaskNotification(newTask);
    } catch (e) {
      set({ tasks: previousTasks }); // Rollback
      throw e;
    }
  },

  toggleTask: async (taskId) => {
    const previousTasks = get().tasks;

    // 1. Optimistic Update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
    }));

    try {
      await storage.toggleTask(taskId);
      // Auto-refresh stats in background
      const user = get().user;
      if (user) await get().loadStats(user.id);

      // Update notification state
      const task = get().tasks.find((t) => t.id === taskId);
      if (task) {
        notificationUtils.scheduleTaskNotification(task);
      }
    } catch (e) {
      set({ tasks: previousTasks }); // Rollback
      throw e;
    }
  },

  updateTask: async (taskId, goalData) => {
    const previousTasks = get().tasks;
    const dateToSave =
      goalData.scheduledDate instanceof Date
        ? goalData.scheduledDate
        : new Date(goalData.scheduledDate);

    // 1. Optimistic Update
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

      // 2. Ensure store has the canonical server version
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));

      // Auto-refresh stats
      const user = get().user;
      if (user) await get().loadStats(user.id);

      // Update notification
      notificationUtils.scheduleTaskNotification(updatedTask);
    } catch (e) {
      set({ tasks: previousTasks }); // Rollback
      throw e;
    }
  },

  deleteTasks: async (taskIds) => {
    const previousTasks = get().tasks;

    // 1. Optimistic Update
    set((state) => ({
      tasks: state.tasks.filter((t) => !taskIds.includes(t.id)),
    }));

    try {
      await storage.deleteTasks(taskIds);
      // Auto-refresh stats
      const user = get().user;
      if (user) await get().loadStats(user.id);
      // Notifications are cancelled inside storage.deleteTasks, but we reinforce
      taskIds.forEach((id) => notificationUtils.cancelTaskNotification(id));
    } catch (e) {
      set({ tasks: previousTasks }); // Rollback
      throw e;
    }
  },

  applyTemplate: async (userId, templateId) => {
    set({ loading: true });
    try {
      await storage.applyTemplate(userId, templateId);
      // After template application, we need to refresh the store
      const { sync } = await storage.fetchTasks(userId);
      const synced = await sync;
      set({ tasks: synced, loading: false });
      // Refresh stats to reflect new tasks
      await get().loadStats(userId);
    } catch (e) {
      console.error("Store applyTemplate failed", e);
      set({ loading: false });
      throw e;
    }
  },
}));
