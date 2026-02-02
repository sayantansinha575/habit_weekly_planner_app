# ROLE

You are a senior full-stack engineer designing a production-ready mobile app system.

---

# APP TYPE

A **mobile-first habit & weekly planner system** focused on execution, streaks, and reminders.
This is NOT a notes app.

---

# TECH STACK

Frontend:

- React Native + Expo

Backend:

- Node.js + Express
- PostgreSQL

Architecture:

- Hybrid model (local device storage + backend sync)

---

# CORE FEATURES

## 1. Reminder System (CRITICAL)

Support:

- Push notifications
- Email reminders
- WhatsApp reminders (high priority)

Behavior:

- User can enable/disable each channel
- User sets reminder time
- Morning reminder sends today’s tasks
- Follow-up reminder if tasks are pending

Sample messages:

- “Good morning! Here’s your plan for today.”
- “2 tasks still pending. Want to reschedule?”
- “Complete 1 task to save your streak 🔥”

---

## 2. Streak System

- Daily streak
- Weekly streak

Rules:

- Completing ≥1 task/day maintains streak
- Missing a day breaks streak

Recovery:

- Streak Freeze (limited per month)
- Get Back on Track logic

---

## 3. Weekly Templates

- One-click apply
- Editable after applying
- Reusable weekly

Required templates:

- Student Exam Week
- Job Search Week
- Fitness / Fat Loss Week
- Business / Hustle Week

---

## 4. Auto-Rollover Logic

- Unfinished daily tasks move to next day
- Unfinished weekly goals roll to next week

User actions:

- Complete
- Reschedule
- Mark as not relevant

---

## 5. Personal Insights (NO ML)

- Task completion percentage
- Best performing day
- Planning time vs completion correlation

---

# OFFLINE-FIRST REQUIREMENTS

- Local storage for tasks & UI state
- Background sync when online
- Conflict resolution (latest action wins)

---

# BACKEND RESPONSIBILITIES

- User authentication
- Reminder scheduling
- WhatsApp/email integration
- Streak calculations
- Insights aggregation
- Feature flag management (free vs paid)

---

# MONETIZATION (PHASE 2)

Paid features:

- WhatsApp reminders
- Unlimited templates
- Advanced insights
- Auto-rollover customization
- PDF export

---

# PERFORMANCE & SCALABILITY

- Handle 100k+ users
- Background jobs for reminders
- Secure APIs
- Minimal payload sizes

---

# GOAL

Build a fast, reliable habit system optimized for daily usage and long-term retention.
