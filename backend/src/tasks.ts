import { prisma } from "./prisma";

export const createTask = async (
  userId: string,
  title: string,
  scheduledDate: Date,
  scheduledTime?: string,
  isNotificationEnabled?: boolean,
) => {
  return prisma.task.create({
    data: {
      userId,
      title,
      scheduledDate,
      scheduledTime,
      isNotificationEnabled,
    },
  });
};

export const updateTask = async (
  taskId: string,
  title: string,
  scheduledDate: Date,
  scheduledTime?: string,
  isNotificationEnabled?: boolean,
) => {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      scheduledDate,
      scheduledTime,
      isNotificationEnabled,
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
      lte: endOfDay,
    };
  }

  return prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });
};

// export const completeTask = async (taskId: string) => {
//   const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
//   if (!currentTask) throw new Error("Task not found");

//   const task = await prisma.task.update({
//     where: { id: taskId },
//     data: { isCompleted: !currentTask.isCompleted },
//   });

//   // Streak Logic: All-or-nothing per day
//   const userId = task.userId;
//   const scheduledDate = new Date(task.scheduledDate);
//   scheduledDate.setHours(0, 0, 0, 0);

//   // Fetch all tasks for this same day
//   const dayTasks = await prisma.task.findMany({
//     where: {
//       userId,
//       scheduledDate: {
//         gte: new Date(scheduledDate),
//         lte: new Date(
//           scheduledDate.getTime() +
//             23 * 60 * 60 * 1000 +
//             59 * 60 * 1000 +
//             59 * 1000 +
//             999,
//         ),
//       },
//     },
//   });

//   const isDayComplete =
//     dayTasks.length > 0 && dayTasks.every((t) => t.isCompleted);
//   const user = await prisma.user.findUnique({ where: { id: userId } });

//   if (user && isDayComplete) {
//     const lastActive = new Date(user.lastActiveAt);
//     lastActive.setHours(0, 0, 0, 0);

//     const diffTime = scheduledDate.getTime() - lastActive.getTime();
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 1) {
//       // Perfect consecutive day!
//       await prisma.user.update({
//         where: { id: userId },
//         data: {
//           dailyStreak: { increment: 1 },
//           lastActiveAt: scheduledDate,
//         },
//       });
//     } else if (diffDays > 1 || user.dailyStreak === 0) {
//       // Gap day or first streak - Reset/Start at 1
//       await prisma.user.update({
//         where: { id: userId },
//         data: {
//           dailyStreak: 1,
//           lastActiveAt: scheduledDate,
//         },
//       });
//     }
//     // If diffDays === 0, they completed the last task of a day they already "passed", or re-completed it. No change.
//   } else if (user && !isDayComplete) {
//     // If the day is NOT complete but it was the "last active" day (the tip of the streak)
//     // and they just unchecked a task, we should potentially decrement.
//     const lastActive = new Date(user.lastActiveAt);
//     lastActive.setHours(0, 0, 0, 0);

//     if (
//       scheduledDate.getTime() === lastActive.getTime() &&
//       user.dailyStreak > 0
//     ) {
//       // Moving tip back by 1 day (conservative estimate)
//       const newLastActive = new Date(scheduledDate);
//       newLastActive.setDate(newLastActive.getDate() - 1);

//       await prisma.user.update({
//         where: { id: userId },
//         data: {
//           dailyStreak: { decrement: 1 },
//           lastActiveAt: newLastActive,
//         },
//       });
//     }
//   }

//   return task;
// };

export const completeTask = async (taskId: string) => {
  const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!currentTask) throw new Error("Task not found");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: !currentTask.isCompleted },
  });

  const userId = task.userId;

  // ✅ SAFELY handle scheduledDate
  if (!task.scheduledDate) return task;

  const scheduledDate = new Date(task.scheduledDate);
  scheduledDate.setHours(0, 0, 0, 0);

  const dayTasks = await prisma.task.findMany({
    where: {
      userId,
      scheduledDate: {
        gte: scheduledDate,
        lte: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    },
  });

  const isDayComplete =
    dayTasks.length > 0 && dayTasks.every((t) => t.isCompleted);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return task;

  // ✅ SAFE DEFAULTS
  const dailyStreak = user.dailyStreak ?? 0;
  const lastActiveAt = user.lastActiveAt ?? null;

  // ==============================
  // WHEN DAY IS COMPLETE
  // ==============================
  if (isDayComplete) {
    if (!lastActiveAt) {
      // First ever completion
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: 1,
          lastActiveAt: scheduledDate,
        },
      });
      return task;
    }

    const lastActive = new Date(lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = scheduledDate.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: { increment: 1 },
          lastActiveAt: scheduledDate,
        },
      });
    } else if (diffDays > 1 || dailyStreak === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: 1,
          lastActiveAt: scheduledDate,
        },
      });
    }
  }

  // ==============================
  // WHEN DAY BECOMES INCOMPLETE
  // ==============================
  else {
    if (!lastActiveAt) return task;

    const lastActive = new Date(lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    if (scheduledDate.getTime() === lastActive.getTime() && dailyStreak > 0) {
      const newLastActive = new Date(scheduledDate);
      newLastActive.setDate(newLastActive.getDate() - 1);

      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyStreak: { decrement: 1 },
          lastActiveAt: newLastActive,
        },
      });
    }
  }

  return task;
};
export const getUserStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
    },
  });

  if (!user) throw new Error("User not found");

  const totalTasks = user.tasks.length;
  const completedTasks = user.tasks.filter((t) => t.isCompleted).length;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Best day logic (simple version)
  const dayCounts: { [key: number]: number } = {};
  user.tasks
    .filter((t) => t.isCompleted)
    .forEach((t) => {
      const day = new Date(t.scheduledDate).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let bestDayIndex = 0;
  let maxCount = -1;
  for (let i = 0; i < 7; i++) {
    if ((dayCounts[i] || 0) > maxCount) {
      maxCount = dayCounts[i] || 0;
      bestDayIndex = i;
    }
  }

  // Weekly progress logic (Monday to Sunday)
  const weeklyProgress = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayDateEnd = new Date(dayDate);
    dayDateEnd.setHours(23, 59, 59, 999);

    const dayStr = dayDate.toISOString().split("T")[0];
    const dayTasks = user.tasks.filter((t) => {
      const taskStr = new Date(t.scheduledDate).toISOString().split("T")[0];

      return taskStr === dayStr;
    });

    const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
    const dayRate =
      dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;

    weeklyProgress.push({
      day: days[dayDate.getDay()],
      rate: Math.round(dayRate),
    });
  }

  return {
    dailyStreak: user.dailyStreak,
    weeklyStreak: user.weeklyStreak,
    completionRate: Math.round(completionRate),
    bestDay: days[bestDayIndex],
    totalTasks,
    completedTasks,
    weeklyProgress,
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
    where: { id: templateId },
  });

  if (!template) throw new Error("Template not found");

  const today = new Date();
  const tasksToCreate = (template.tasks as any[]).map((t) => ({
    userId,
    title: t.title,
    scheduledDate: today,
    scheduledTime: t.scheduledTime,
    isCompleted: false,
    isNotificationEnabled: true,
  }));

  // Create tasks for the user
  return prisma.task.createMany({
    data: tasksToCreate,
  });
};

export const deleteTasks = async (taskIds: string[]) => {
  return prisma.task.deleteMany({
    where: {
      id: { in: taskIds },
    },
  });
};
