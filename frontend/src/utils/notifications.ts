import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const notificationUtils = {
  requestPermissions: async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  },

  scheduleTaskNotification: async (task: any) => {
    if (!task.isNotificationEnabled || task.isCompleted) {
      await notificationUtils.cancelTaskNotification(task.id);
      return;
    }

    // Cancel existing one first to avoid duplicates
    await notificationUtils.cancelTaskNotification(task.id);

    const rawDate = new Date(task.scheduledDate);
    // Strip time → keep only date
    const scheduledDate = new Date(
      rawDate.getFullYear(),
      rawDate.getMonth(),
      rawDate.getDate(),
    );

    if (task.scheduledTime) {
      const [hours, minutes] = task.scheduledTime.split(":").map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
    } else {
      scheduledDate.setHours(9, 0, 0, 0);
    }

    // 2️⃣ Calculate delay in seconds
    const diffMs = scheduledDate.getTime() - Date.now();
    if (diffMs <= 0) {
      console.log(
        "Skipping past notification:",
        scheduledDate.toLocaleString(),
      );
      return;
    }

    const seconds = Math.ceil(diffMs / 1000);

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task Reminder 🎯",
          body: task.title,
          data: { taskId: task.id },
          sound: true,
        },

        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds, // ✅ bulletproof
        },
      });
      console.log(
        `Notification scheduled for ${task.title} at ${scheduledDate.toLocaleString()}`,
      );
      return identifier;
    } catch (e) {
      console.error("Failed to schedule notification", e);
    }
  },

  cancelTaskNotification: async (taskId: string) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const target = scheduled.find((n) => n.content.data?.taskId === taskId);
    if (target) {
      await Notifications.cancelScheduledNotificationAsync(target.identifier);
      console.log("Cancelled notification for task:", taskId);
    }
  },
};
