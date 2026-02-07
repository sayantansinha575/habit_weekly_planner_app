import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = () => {
    // For physical device, replace with your machine's local IP (e.g. 192.168.1.X)
    // For Android Emulator, use 10.0.2.2
    // For iOS Simulator or Web, use localhost
    
    // DEV CONFIG: Local IP for physical device
    const LOCAL_IP = '192.168.0.101';

    if (Platform.OS === 'android') {
        // Return local IP for physical Android device
        return `http://${LOCAL_IP}:3000`;
    }
    
    if (Platform.OS === 'ios') {
        return `http://${LOCAL_IP}:3000`;
    }

    return 'http://localhost:3000';
};

const BASE_URL = getBackendUrl();

export const api = {
    getTasks: async (userId: string) => {
        const url = new URL(`${BASE_URL}/tasks`);
        url.searchParams.append('userId', userId);
        // if (date) {
        //     url.searchParams.append('date', date);
        // }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        return response.json();
    },

        getTasksonCurrentDate: async (userId: string, date: string) => {
        const url = new URL(`${BASE_URL}/tasks`);
        url.searchParams.append('userId', userId);
        url.searchParams.append('date', date);
        
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error('Failed to fetch current Date tasks');
        }
        return response.json();
    },

    addTask: async (userId: string, title: string, scheduledDate: string, scheduledTime?: string, isNotificationEnabled: boolean = true) => {
        const response = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                title,
                scheduledDate,
                scheduledTime,
                isNotificationEnabled,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to add task');
        }
        return response.json();
    },

    completeTask: async (taskId: string) => {
        const response = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to complete task');
        }
        return response.json();
    },

    updateTask: async (taskId: string, title: string, scheduledDate: string, scheduledTime?: string, isNotificationEnabled: boolean = true) => {
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                scheduledDate,
                scheduledTime,
                isNotificationEnabled,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        return response.json();
    },

    getUserStats: async (userId: string) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/stats`);
        if (!response.ok) {
            throw new Error('Failed to fetch user stats');
        }
        return response.json();
    },

    getTemplates: async () => {
        const response = await fetch(`${BASE_URL}/templates`);
        if (!response.ok) {
            throw new Error('Failed to fetch templates');
        }
        return response.json();
    },

    applyTemplate: async (userId: string, templateId: string) => {
        const response = await fetch(`${BASE_URL}/templates/${templateId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
            throw new Error('Failed to apply template');
        }
        return response.json();
    },

    deleteTasks: async (taskIds: string[]) => {
        const response = await fetch(`${BASE_URL}/tasks`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskIds }),
        });
        if (!response.ok) {
            throw new Error('Failed to delete tasks');
        }
        return response.json();
    }
};
