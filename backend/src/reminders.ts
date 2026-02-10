import cron from "node-cron";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { rolloverTasks } from "./tasks";

interface Task {
  title: string;
  scheduledDate: Date;
  scheduledTime?: string | null;
  isCompleted: boolean;
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailReminder = async (email: string, tasks: Task[]) => {
  const taskList = tasks.map((t) => `- ${t.title}`).join("\n");
  await transporter.sendMail({
    from: '"Habit Planner" <no-reply@habitapp.com>',
    to: email,
    subject: "Today's Plan 🔥",
    text: `Good morning! Here's your plan for today:\n\n${taskList}\n\nComplete 1 task to save your streak!`,
  });
};

export const sendWhatsAppReminder = async (number: string, message: string) => {
  const url = `${process.env.GREEN_API_URL}/waInstance${process.env.GREEN_API_ID_INSTANCE}/sendMessage/${process.env.GREEN_API_TOKEN}`;

  // Format number for Green API (strip non-digits and append @c.us if not present)
  let chatId = number.replace(/\D/g, "");
  if (!chatId.endsWith("@c.us")) {
    chatId += "@c.us";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message,
      }),
    });

    const data = await response.json();
    console.log(`[GREEN API] Response for ${number}:`, data);
    return data;
  } catch (e) {
    console.error(`[GREEN API] Failed to send to ${number}:`, e);
  }
};

// Daily morning reminder at 7 AM
cron.schedule("0 7 * * *", async () => {
  console.log("Running daily morning reminders...");
  const users = await prisma.user.findMany({
    where: { whatsappNumber: { not: null } },
    include: { tasks: true },
  });

  for (const user of users) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = user.tasks.filter((t: any) => {
      const taskDate = new Date(t.scheduledDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && !t.isCompleted;
    });

    if (todayTasks.length > 0 && user.whatsappNumber) {
      const taskList = todayTasks.map((t) => `- ${t.title}`).join("\n");
      await sendWhatsAppReminder(
        user.whatsappNumber,
        `☀️ Good morning! You have ${todayTasks.length} tasks for today:\n\n${taskList}\n\nStay focused! 🚀`,
      );
    }
  }
});

// Per-task scheduled reminders (every minute)
// cron.schedule("* * * * *", async () => {
//   const now = new Date();
//   const startOfDay = new Date();
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date();
//   endOfDay.setHours(23, 59, 59, 999);

//   // HH:mm in 24h format
//   const currentTimeStr = now.toLocaleTimeString("en-GB", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   console.log(`Checking task reminders for ${currentTimeStr}...`);

//   const tasks = await prisma.task.findMany({
//     where: {
//       isNotificationEnabled: true,
//       isCompleted: false,
//       scheduledTime: currentTimeStr,
//       scheduledDate: {
//         gte: startOfDay,
//         lte: endOfDay,
//       },
//       user: {
//         whatsappNumber: { not: null },
//       },
//     },
//     include: {
//       user: true,
//     },
//   });

//   for (const task of tasks) {
//     if (task.user.whatsappNumber) {
//       console.log(
//         `Sending WhatsApp reminder for task: ${task.title} to ${task.user.whatsappNumber}`,
//       );
//       await sendWhatsAppReminder(
//         task.user.whatsappNumber,
//         `🎯 Task Reminder: "${task.title}" is scheduled for now!\n\nKeep going! 💪`,
//       );
//     }
//   }
// });

// Auto-rollover at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running auto-rollover...");
  await rolloverTasks();
});
