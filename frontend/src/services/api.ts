import Constants from "expo-constants";
import { Platform } from "react-native";

const getBackendUrl = () => {
  // For physical device, replace with your machine's local IP (e.g. 192.168.1.X)
  // For Android Emulator, use 10.0.2.2
  // For iOS Simulator or Web, use localhost

  // DEV CONFIG: Local IP for physical device
  const isProduction = false;
  const LOCAL_IP = "192.168.0.102";

  if (Platform.OS === "android") {
    // Return local IP for physical Android device
    if (isProduction) {
      return "https://habit-weekly-planner-app.onrender.com";
    } else {
      return `http://${LOCAL_IP}:5000`;
    }
  }

  if (Platform.OS === "ios") {
    if (isProduction) {
      return "https://habit-weekly-planner-app.onrender.com";
    } else {
      return `http://${LOCAL_IP}:5000`;
    }
  }

  return "http://localhost:5000";
};

const BASE_URL = getBackendUrl();

// Helper to get auth headers from Zustand store
const getAuthHeaders = () => {
  // We import dynamically to avoid circular dependency
  const { useTaskStore } = require("../store/useTaskStore");
  const session = useTaskStore.getState().session;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
};

export const api = {
  getTasks: async (userId: string) => {
    const url = new URL(`${BASE_URL}/tasks`);
    url.searchParams.append("userId", userId);

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    return response.json();
  },

  getTasksonCurrentDate: async (userId: string, date: string) => {
    const url = new URL(`${BASE_URL}/tasks`);
    url.searchParams.append("userId", userId);
    url.searchParams.append("date", date);

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch current Date tasks");
    }
    return response.json();
  },

  addTask: async (
    userId: string,
    title: string,
    scheduledDate: string,
    scheduledTime?: string,
    isNotificationEnabled: boolean = true,
  ) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId,
        title,
        scheduledDate,
        scheduledTime,
        isNotificationEnabled,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to add task");
    }
    return response.json();
  },

  completeTask: async (taskId: string) => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to complete task");
    }
    return response.json();
  },

  updateTask: async (
    taskId: string,
    title: string,
    scheduledDate: string,
    scheduledTime?: string,
    isNotificationEnabled: boolean = true,
  ) => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        scheduledDate,
        scheduledTime,
        isNotificationEnabled,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to update task");
    }
    return response.json();
  },

  getUserStats: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/users/${userId}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user stats");
    }
    return response.json();
  },

  getTemplates: async () => {
    const response = await fetch(`${BASE_URL}/templates`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch templates");
    }
    return response.json();
  },

  applyTemplate: async (userId: string, templateId: string) => {
    const response = await fetch(`${BASE_URL}/templates/${templateId}/apply`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to apply template");
    }
    return response.json();
  },

  deleteTasks: async (taskIds: string[]) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ taskIds }),
    });
    if (!response.ok) {
      throw new Error("Failed to delete tasks");
    }
    return response.json();
  },

  // Cal AI Endpoints
  getCalAiProfile: async (userId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/cal-ai/profile?userId=${userId}`,
      { headers: getAuthHeaders() },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch Cal AI profile");
    return response.json();
  },

  updateCalAiProfile: async (userId: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/cal-ai/profile`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, ...data }),
    });
    if (!response.ok) throw new Error("Failed to update Cal AI profile");
    return response.json();
  },

  getCalAiDashboard: async (userId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/cal-ai/dashboard?userId=${userId}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error("Failed to fetch Cal AI dashboard");
    return response.json();
  },

  analyzeMeal: async (
    userId: string,
    description: string,
    imageBase64?: string,
  ) => {
    const response = await fetch(`${BASE_URL}/api/cal-ai/analyze-meal`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, description, imageBase64 }),
    });
    if (!response.ok) throw new Error("Failed to analyze meal");
    return response.json();
  },
  resetCalAiDashboard: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/api/cal-ai/reset`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error("Failed to reset dashboard");
    return response.json();
  },
  getCalAiProgress: async (userId: string, days: number = 7) => {
    const response = await fetch(
      `${BASE_URL}/api/cal-ai/progress/${userId}?days=${days}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error("Failed to fetch progress data");
    return response.json();
  },

  verifySupabaseAuth: async (token: string) => {
    const response = await fetch(`${BASE_URL}/auth/supabase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to verify Supabase auth");
    }
    return response.json();
  },
};
