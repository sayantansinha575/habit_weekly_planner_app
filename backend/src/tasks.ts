import { prisma } from './prisma';

export const createTask = async (userId: string, title: string, scheduledDate: Date, scheduledTime?: string, isNotificationEnabled?: boolean) => {
  return prisma.task.create({
    data: {
      userId,
      title,
      scheduledDate,
      scheduledTime,
      isNotificationEnabled
    },
  });
};

export const getTasks = async (userId: string, date?: Date) => {
  const whereClause: any = { userId };
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    whereClause.scheduledDate = {
      gte: startOfDay,
      lte: endOfDay
    };
  }
  
  return prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' }
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
