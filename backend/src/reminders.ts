import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { prisma } from './index';
import { rolloverTasks } from './tasks';

interface Task {
  title: string;
  scheduledDate: Date;
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
  const taskList = tasks.map(t => `- ${t.title}`).join('\n');
  await transporter.sendMail({
    from: '"Habit Planner" <no-reply@habitapp.com>',
    to: email,
    subject: "Today's Plan 🔥",
    text: `Good morning! Here's your plan for today:\n\n${taskList}\n\nComplete 1 task to save your streak!`,
  });
};

export const sendWhatsAppReminder = async (number: string, message: string) => {
  console.log(`[MOCK WHATSAPP] Sending to ${number}: ${message}`);
  // In production, use Twilio or WhatsApp Business API here
};

// Daily morning reminder at 7 AM
cron.schedule('0 7 * * *', async () => {
  console.log('Running daily morning reminders...');
  const users = await prisma.user.findMany({ include: { tasks: true } });
  
  for (const user of users) {
    const todayTasks = user.tasks.filter((t: Task) => {
      const today = new Date();
      return t.scheduledDate.toDateString() === today.toDateString() && !t.isCompleted;
    });

    if (todayTasks.length > 0) {
      if (user.email) await sendEmailReminder(user.email, todayTasks);
      if (user.whatsappNumber) await sendWhatsAppReminder(user.whatsappNumber, `Good morning! You have ${todayTasks.length} tasks today.`);
    }
  }
});

// Auto-rollover at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running auto-rollover...');
  await rolloverTasks();
});
