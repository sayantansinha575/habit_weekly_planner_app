import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const TASKS_KEY = '@tasks';

export const storage = {
  // Load tasks: API -> Local Fallback
  fetchTasks: async (userId: string, date: Date) => {
    try {
      console.log('Fetching tasks from backend...');
      // Convert date to YYYY-MM-DD for API
      const dateStr = date.toISOString();
      const remoteTasks = await api.getTasks(userId, dateStr);
      
      // Save to local storage for offline use (replacing current cache for this view)
      // Note: In a real app, you'd merge or use a proper DB.
      // For now, we just cache the latest fetch.
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(remoteTasks));
      
      return remoteTasks;
    } catch (e) {
      console.warn('Backend fetch failed, loading from local storage', e);
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    }
  },

  // Save task: Local + API (Fire and Forget)
  addTask: async (userId: string, title: string, scheduledDate: Date, scheduledTime?: string, isNotificationEnabled: boolean = true) => {
    try {
      // 1. API Call
      const newTask = await api.addTask(userId, title, scheduledDate.toISOString(), scheduledTime, isNotificationEnabled);
      
      // 2. Update Local (Fetch current, append, save)
      const current = await storage.getLocalTasks();
      const updated = [...current, newTask];
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      
      return newTask;
    } catch (e) {
        console.error('Failed to add task', e);
        throw e; // Let UI handle error or implement retry queue
    }
  },

  // Toggle/Update: Local + API
  toggleTask: async (taskId: string) => {
      // 1. API Call
      try {
          await api.completeTask(taskId);
      } catch (e) {
          console.error('Failed to complete task on backend', e);
      }

      // 2. Update Local
      const current = await storage.getLocalTasks();
      const updated = current.map((t: any) => 
          t.id === taskId ? { ...t, isCompleted: true } : t
      );
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      return updated;
  },

  getLocalTasks: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      return [];
    }
  }
};

export const saveTasksLocally = async (tasks: any[]) => {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

