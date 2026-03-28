import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { register, login, upsertSupabaseUser } from "./auth";
import {
  verifySupabaseToken,
  verifySupabaseJWT,
  AuthenticatedRequest,
} from "./middleware/authMiddleware";
import {
  createTask,
  completeTask,
  getTasks,
  updateTask,
  getUserStats,
  getTemplates,
  applyTemplate,
  rolloverTasks,
  deleteTasks,
} from "./tasks";
import {
  getCalAiProfile,
  updateCalAiProfile,
  getCalAiDashboard,
  analyzeMeal,
  resetTodayMeals,
  getCalAiProgress,
} from "./cal-ai";
import { requestAccountDeletion } from "./user";
import { prisma } from "./prisma";
import "./reminders";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
console.log("2");

// Auth Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await register(email, password);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

app.post(
  "/auth/supabase",
  verifySupabaseJWT,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) throw new Error("User info missing from token");

      const { user, isNewUser } = await upsertSupabaseUser(
        req.user.email,
        req.user.supabaseId,
      );

      // Create an app-specific JWT (optional, but requested by user)
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "your_secret_key",
      );

      res.json({ user, token, isNewUser });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

// Task Routes (Protected)
app.post(
  "/tasks",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    const { title, scheduledDate, scheduledTime, isNotificationEnabled } =
      req.body;
    const task = await createTask(
      req.user?.id!,
      title,
      new Date(scheduledDate),
      scheduledTime,
      isNotificationEnabled,
    );
    res.json(task);
    console.log("Task created:", task);
  },
);

app.get("/templates", verifySupabaseToken, async (req, res) => {
  try {
    const templates = await getTemplates();
    console.log("Templates:", templates);
    res.json(templates);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/templates/:id/apply",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = req.params.id as string;
      const result = await applyTemplate(req.user?.id!, templateId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.put("/tasks/:id", verifySupabaseToken, async (req, res) => {
  const { title, scheduledDate, scheduledTime, isNotificationEnabled } =
    req.body;
  try {
    const task = await updateTask(
      req.params.id as string,
      title,
      new Date(scheduledDate),
      scheduledTime,
      isNotificationEnabled,
    );
    res.json(task);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/tasks/:id/complete", verifySupabaseToken, async (req, res) => {
  const task = await completeTask(req.params.id as string);
  res.json(task);
});

app.delete("/tasks", verifySupabaseToken, async (req, res) => {
  try {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds)) {
      res.status(400).json({ error: "taskIds array is required" });
      return;
    }
    const result = await deleteTasks(taskIds);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put(
  "/users/:id",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    try {
      const { ...data } = req.body;

      // Security: Only allow user to update their own profile
      if (req.user?.id !== id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...data,
        },
      });

      res.json(updatedUser);
    } catch (e: any) {
      console.error(`Failed to update user ${id}:`, e);
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/users/:id/stats",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Prioritize req.user.id for security, but allow params if we wanted to view others' stats (not currently supported)
      const stats = await getUserStats(req.user?.id!);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/tasks",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dateStr = req.query.date as string;

      const date = dateStr ? new Date(dateStr) : undefined;
      const tasks = await getTasks(req.user?.id!, date);
      res.json(tasks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.post("/tasks/rollover", async (req, res) => {
  try {
    await rolloverTasks();
    res.json({ status: "success", message: "Tasks rolled over" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Simulate daily rollover (every 6 hours for dev purposes)
// setInterval(
//   async () => {
//     console.log("Running auto-rollover...");
//     try {
//       await rolloverTasks();
//     } catch (e) {
//       console.error("Auto-rollover failed:", e);
//     }
//   },
//   6 * 60 * 60 * 1000,
// );

// Cal AI Routes (Protected)
app.get(
  "/api/cal-ai/profile",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await getCalAiProfile(req.user?.id!);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/cal-ai/profile",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { ...data } = req.body;
      const profile = await updateCalAiProfile(req.user?.id!, data);
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get(
  "/api/cal-ai/dashboard",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dashboard = await getCalAiDashboard(req.user?.id!);
      if (!dashboard)
        return res.status(404).json({ error: "Profile not found" });
      res.json(dashboard);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post("/api/cal-ai/analyze-meal", verifySupabaseToken, async (req, res) => {
  try {
    const { userId, description, imageBase64 } = req.body;
    const meal = await analyzeMeal(userId, description, imageBase64);
    res.json(meal);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/cal-ai/reset", verifySupabaseToken, async (req, res) => {
  try {
    const { userId } = req.body;
    await resetTodayMeals(userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get(
  "/api/cal-ai/progress/:userId",
  verifySupabaseToken,
  async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const data = await getCalAiProgress(req.params.userId as string, days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  "/api/users/delete-request",
  verifySupabaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "Reason is required" });
      }
      const result = await requestAccountDeletion(req.user?.id!, reason);
      res.json(result);
    } catch (e: any) {
      console.error("Account deletion request error:", e);
      res.status(500).json({ error: e.message });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log("1");
