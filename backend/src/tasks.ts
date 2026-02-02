import { prisma } from './index';

export const createTask = async (userId: string, title: string, scheduledDate: Date) => {
  return prisma.task.create({
    data: {
      userId,
      title,
      scheduledDate,
    },
  });
};

export const completeTask = async (taskId: string) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: true },
  });

  // Update streak logic
  const userId = task.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(user.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    if (today.getTime() > lastActive.getTime()) {
      // It's a new day, increment streak
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
    }
  }

  return task;
};

export const rolloverTasks = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const unfinishedTasks = await prisma.task.findMany({
    where: {
      isCompleted: false,
      scheduledDate: {
        lt: new Date(),
      },
    },
  });

  for (const task of unfinishedTasks) {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        isAutoRolled: true,
        rolledCount: { increment: 1 },
        scheduledDate: new Date(), // Move to today
      },
    });
  }
};
