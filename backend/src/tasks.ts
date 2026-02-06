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

export const updateTask = async (taskId: string, title: string, scheduledDate: Date, scheduledTime?: string, isNotificationEnabled?: boolean) => {
  return prisma.task.update({
    where: { id: taskId },
    data: {
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
  const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!currentTask) throw new Error('Task not found');

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: !currentTask.isCompleted },
  });

  // Only update streak if the task was JUST completed
  if (task.isCompleted) {
    const userId = task.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user) {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(user.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // Incremental streak (yesterday was last active)
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: { increment: 1 },
          lastActiveAt: now,
        },
      });
    } else if (diffDays > 1) {
      // Reset streak (missed days)
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: 1,
          lastActiveAt: now,
        },
      });
    } else if (user.dailyStreak === 0) {
        // First ever task or streak was 0
        await prisma.user.update({
          where: { id: userId },
          data: {
            dailyStreak: 1,
            lastActiveAt: now,
          },
        });
    }
    // If diffDays === 0, they already completed something today, no streak change
    }
  }

  return task;
};

export const getUserStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true
    }
  });

  if (!user) throw new Error('User not found');

  const totalTasks = user.tasks.length;
  const completedTasks = user.tasks.filter(t => t.isCompleted).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Best day logic (simple version)
  const dayCounts: { [key: number]: number } = {};
  user.tasks.filter(t => t.isCompleted).forEach(t => {
    const day = new Date(t.scheduledDate).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let bestDayIndex = 0;
  let maxCount = -1;
  for (let i = 0; i < 7; i++) {
    if ((dayCounts[i] || 0) > maxCount) {
      maxCount = dayCounts[i] || 0;
      bestDayIndex = i;
    }
  }

  return {
    dailyStreak: user.dailyStreak,
    weeklyStreak: user.weeklyStreak,
    completionRate: Math.round(completionRate),
    bestDay: days[bestDayIndex],
    totalTasks,
    completedTasks
  };
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

export const getTemplates = async () => {
  return prisma.template.findMany();
};

export const applyTemplate = async (userId: string, templateId: string) => {
  const template = await prisma.template.findUnique({
    where: { id: templateId }
  });

  if (!template) throw new Error('Template not found');

  const today = new Date();
  const tasksToCreate = (template.tasks as any[]).map(t => ({
    userId,
    title: t.title,
    scheduledDate: today,
    scheduledTime: t.scheduledTime,
    isCompleted: false,
    isNotificationEnabled: true,
  }));

  // Create tasks for the user
  return prisma.task.createMany({
    data: tasksToCreate
  });
};
