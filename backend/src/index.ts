import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { register, login } from './auth';
import { createTask, completeTask } from './tasks';
import './reminders';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
console.log('2');

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await register(email, password);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

// Task Routes
app.post('/tasks', async (req, res) => {
  const { userId, title, scheduledDate } = req.body;
  const task = await createTask(userId, title, new Date(scheduledDate));
  res.json(task);
});

app.post('/tasks/:id/complete', async (req, res) => {
  const task = await completeTask(req.params.id);
  res.json(task);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('1')

export { prisma };
