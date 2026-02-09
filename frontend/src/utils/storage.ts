import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { notificationUtils } from "./notifications";

const TASKS_KEY = "@tasks";

export const storage = {
  // Load tasks: API -> Local Fallback
  fetchTasks: async (userId: string) => {
    try {
      console.log("Fetching tasks from backend...");
      // Convert date to YYYY-MM-DD for API
      // const dateStr = date.toISOString();
      const remoteTasks = await api.getTasks(userId);

      // Save to local storage for offline use (replacing current cache for this view)
      // Note: In a real app, you'd merge or use a proper DB.
      // For now, we just cache the latest fetch.
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));

      return remoteTasks;
    } catch (e) {
      console.warn("Backend fetch failed, loading from local storage", e);
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    }
  },

  fetchTasksonCurrentDate: async (userId: string, date: Date) => {
    try {
      console.log("Fetching Current date tasks from backend...");
      // Convert date to YYYY-MM-DD for API
      const dateStr = date.toISOString();
      const remoteTasks = await api.getTasksonCurrentDate(userId, dateStr);

      // Save to local storage for offline use (replacing current cache for this view)
      // Note: In a real app, you'd merge or use a proper DB.
      // For now, we just cache the latest fetch.
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));

      return remoteTasks;
    } catch (e) {
      console.warn(
        "Backend fetch failed Current date Task, loading from local storage",
        e,
      );
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
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
      const stats = await api.getUserStats(userId);
      await AsyncStorage.setItem(`@stats_${userId}`, JSON.stringify(stats));
      return stats;
    } catch (e) {
      const jsonValue = await AsyncStorage.getItem(`@stats_${userId}`);
      return jsonValue != null
        ? JSON.parse(jsonValue)
        : {
            dailyStreak: 0,
            weeklyStreak: 0,
            completionRate: 0,
            bestDay: "N/A",
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
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    }
  },

  applyTemplate: async (userId: string, templateId: string) => {
    try {
      await api.applyTemplate(userId, templateId);
      // 2. Re-fetch to get tasks and schedule notifications
      const remoteTasks = await storage.fetchTasksonCurrentDate(
        userId,
        new Date(),
      );
      // 3. Notifications
      remoteTasks.forEach((t: any) =>
        notificationUtils.scheduleTaskNotification(t),
      );
      return true;
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
};

export const saveTasksLocally = async (tasks: any[]) => {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};
