import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveTasksLocally = async (tasks: any[]) => {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem('@tasks', jsonValue);
  } catch (e) {
    console.error('Error saving tasks locally', e);
  }
};

export const loadTasksLocally = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@tasks');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading tasks locally', e);
    return [];
  }
};

export const syncWithBackend = async (tasks: any[]) => {
  // Simple "latest wins" sync logic
  // In production, you'd compare timestamps or use a more robust conflict resolution
  console.log('Syncing tasks with backend...');
  // await axios.post('/sync', { tasks });
};
