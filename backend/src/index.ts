import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { register, login } from "./auth";
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
} from "./cal-ai";
import { prisma } from "./prisma";
import "./reminders";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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

// Task Routes
app.post("/tasks", async (req, res) => {
  const { userId, title, scheduledDate, scheduledTime, isNotificationEnabled } =
    req.body;
  const task = await createTask(
    userId,
    title,
    new Date(scheduledDate),
    scheduledTime,
    isNotificationEnabled,
  );
  res.json(task);
  console.log("Task created:", task);
});

app.get("/templates", async (req, res) => {
  try {
    const templates = await getTemplates();
    res.json(templates);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/templates/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await applyTemplate(userId, req.params.id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { title, scheduledDate, scheduledTime, isNotificationEnabled } =
    req.body;
  try {
    const task = await updateTask(
      req.params.id,
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

app.post("/tasks/:id/complete", async (req, res) => {
  const task = await completeTask(req.params.id);
  res.json(task);
});

app.delete("/tasks", async (req, res) => {
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

app.get("/users/:id/stats", async (req, res) => {
  try {
    const stats = await getUserStats(req.params.id);
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const dateStr = req.query.date as string;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const date = dateStr ? new Date(dateStr) : undefined;
    const tasks = await getTasks(userId, date);
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

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
setInterval(
  async () => {
    console.log("Running auto-rollover...");
    try {
      await rolloverTasks();
    } catch (e) {
      console.error("Auto-rollover failed:", e);
    }
  },
  6 * 60 * 60 * 1000,
);

// Cal AI Routes
app.get("/api/cal-ai/profile", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const profile = await getCalAiProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/cal-ai/profile", async (req, res) => {
  try {
    const { userId, ...data } = req.body;
    const profile = await updateCalAiProfile(userId, data);
    res.json(profile);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/cal-ai/dashboard", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const dashboard = await getCalAiDashboard(userId);
    if (!dashboard) return res.status(404).json({ error: "Profile not found" });
    res.json(dashboard);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/cal-ai/analyze-meal", async (req, res) => {
  try {
    const { userId, description, imageBase64 } = req.body;
    const meal = await analyzeMeal(userId, description, imageBase64);
    res.json(meal);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log("1");
