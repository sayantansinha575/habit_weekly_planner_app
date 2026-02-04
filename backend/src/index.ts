import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { register, login } from './auth';
import { createTask, completeTask, getTasks } from './tasks';
import './reminders';

dotenv.config();

const app = express();

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
  const { userId, title, scheduledDate, scheduledTime, isNotificationEnabled } = req.body;
  const task = await createTask(userId, title, new Date(scheduledDate), scheduledTime, isNotificationEnabled);
  res.json(task);
  console.log('Task created:', task);
});

app.post('/tasks/:id/complete', async (req, res) => {
  const task = await completeTask(req.params.id);
  res.json(task);
});

app.get('/tasks', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const dateStr = req.query.date as string;
    
    if (!userId) {
       res.status(400).json({ error: 'userId is required' });
       return;
    }

    const date = dateStr ? new Date(dateStr) : undefined;
    const tasks = await getTasks(userId, date);
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('1')


