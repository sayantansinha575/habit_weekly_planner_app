import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { notificationUtils } from "./notifications";

const TASKS_KEY = "@tasks";

export const storage = {
  // Load tasks: API -> Local Fallback
  fetchTasks: async (userId: string) => {
    try {
      const fetchAndSave = async () => {
        try {
          const remoteTasks = await api.getTasks(userId);
          await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));
          return remoteTasks;
        } catch (e) {
          console.warn("Background fetch tasks failed", e);
          return [];
        }
      };

      const local = await storage.getLocalTasks();
      return {
        local,
        sync: fetchAndSave(),
      };
    } catch (e) {
      console.warn("fetchTasks failed", e);
      return { local: [], sync: Promise.resolve([]) };
    }
  },

  fetchTasksonCurrentDate: async (userId: string, date: Date) => {
    try {
      // Background sync
      const fetchAndSave = async () => {
        try {
          const dateStr = date.toISOString();
          const remoteTasks = await api.getTasksonCurrentDate(userId, dateStr);
          await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));
          return remoteTasks;
        } catch (e) {
          console.warn("Background fetch failed", e);
        }
      };

      // Return local first if available
      const local = await storage.getLocalTasks();
      // Only return local if it contains tasks or if we want to show empty state immediately
      // But for "current date", we might want to trigger the sync in parallel
      return {
        local,
        sync: fetchAndSave(),
      };
    } catch (e) {
      console.warn("fetchTasksonCurrentDate failed", e);
      return { local: [], sync: Promise.resolve([]) };
    }
  },

  // Save task: Local + API (Fire and Forget)
  addTask: async (
    userId: string,
    title: string,
    scheduledDate: Date,
    scheduledTime?: string,
    isNotificationEnabled: boolean = true,
  ) => {
    try {
      // 1. API Call
      const newTask = await api.addTask(
        userId,
        title,
        scheduledDate.toISOString(),
        scheduledTime,
        isNotificationEnabled,
      );

      // 2. Update Local (Fetch current, append, save)
      const current = await storage.getLocalTasks();
      const updated = [...current, newTask];
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));

      // 3. Notifications
      notificationUtils.scheduleTaskNotification(newTask);

      return newTask;
    } catch (e) {
      console.error("Failed to add task", e);
      throw e; // Let UI handle error or implement retry queue
    }
  },

  // Toggle/Update: Local + API
  toggleTask: async (taskId: string) => {
    // 1. API Call
    try {
      await api.completeTask(taskId);
    } catch (e) {
      console.error("Failed to complete task on backend", e);
    }

    // 2. Update Local
    const current = await storage.getLocalTasks();
    const updated = current.map((t: any) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
    );

    // 3. Notifications
    const task = updated.find((t: any) => t.id === taskId);
    if (task) {
      if (task.isCompleted) {
        notificationUtils.cancelTaskNotification(taskId);
      } else {
        notificationUtils.scheduleTaskNotification(task);
      }
    }

    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    return updated;
  },

  // Update task: Local + API
  updateTask: async (
    taskId: string,
    title: string,
    scheduledDate: Date,
    scheduledTime?: string,
    isNotificationEnabled: boolean = true,
  ) => {
    try {
      // 1. API Call
      const updatedTask = await api.updateTask(
        taskId,
        title,
        scheduledDate.toISOString(),
        scheduledTime,
        isNotificationEnabled,
      );

      // 2. Update Local
      const current = await storage.getLocalTasks();
      const updated = current.map((t: any) =>
        t.id === taskId ? updatedTask : t,
      );
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));

      // 3. Notifications
      notificationUtils.scheduleTaskNotification(updatedTask);

      return updatedTask;
    } catch (e) {
      console.error("Failed to update task", e);
      throw e;
    }
  },

  getLocalTasks: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      return [];
    }
  },

  getUserStats: async (userId: string) => {
    try {
      const fetchAndSave = async () => {
        try {
          const stats = await api.getUserStats(userId);
          await AsyncStorage.setItem(`@stats_${userId}`, JSON.stringify(stats));
          return stats;
        } catch (e) {
          console.warn("Background fetch stats failed", e);
          return null;
        }
      };

      const jsonValue = await AsyncStorage.getItem(`@stats_${userId}`);
      const local =
        jsonValue != null
          ? JSON.parse(jsonValue)
          : {
              dailyStreak: 0,
              weeklyStreak: 0,
              completionRate: 0,
              bestDay: "N/A",
            };

      return {
        local,
        sync: fetchAndSave(),
      };
    } catch (e) {
      return {
        local: {
          dailyStreak: 0,
          weeklyStreak: 0,
          completionRate: 0,
          bestDay: "N/A",
        },
        sync: Promise.resolve(null),
      };
    }
  },

  getTemplates: async () => {
    try {
      const templates = await api.getTemplates();
      await AsyncStorage.setItem("@templates", JSON.stringify(templates));
      return templates;
    } catch (e) {
      const jsonValue = await AsyncStorage.getItem("@templates");
      console.log("Templates from local storage:", jsonValue);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    }
  },

  applyTemplate: async (userId: string, templateId: string) => {
    try {
      await api.applyTemplate(userId, templateId);
      // 2. Re-fetch synchronously to ensure we have the data for notifications
      const dateStr = new Date().toISOString();
      const remoteTasks = await api.getTasksonCurrentDate(userId, dateStr);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));

      // 3. Notifications
      remoteTasks.forEach((t: any) =>
        notificationUtils.scheduleTaskNotification(t),
      );
      return remoteTasks;
    } catch (e) {
      console.error("Failed to apply template", e);
      throw e;
    }
  },

  deleteTasks: async (taskIds: string[]) => {
    try {
      // 1. API Call
      await api.deleteTasks(taskIds);

      // 2. Update Local
      const current = await storage.getLocalTasks();
      const updated = current.filter((t: any) => !taskIds.includes(t.id));
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));

      // 3. Notifications
      taskIds.forEach((id) => notificationUtils.cancelTaskNotification(id));

      return updated;
    } catch (e) {
      console.error("Failed to delete tasks", e);
      throw e;
    }
  },

  getCalAiProgress: async (userId: string, days: number = 7) => {
    const key = `@cal_ai_progress_${userId}_${days}`;
    try {
      const fetchAndSave = async () => {
        try {
          const data = await api.getCalAiProgress(userId, days);
          await AsyncStorage.setItem(key, JSON.stringify(data));
          return data;
        } catch (e) {
          console.warn(`Background fetch cal-ai progress(${days}) failed`, e);
          return null;
        }
      };

      const jsonValue = await AsyncStorage.getItem(key);
      const local = jsonValue != null ? JSON.parse(jsonValue) : null;

      return {
        local,
        sync: fetchAndSave(),
      };
    } catch (e) {
      console.warn("getCalAiProgress storage failed", e);
      return { local: null, sync: Promise.resolve(null) };
    }
  },
};

export const saveTasksLocally = async (tasks: any[]) => {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};
