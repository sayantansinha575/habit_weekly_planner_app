# 🚀 Feature: Cal AI Section with First-Time Onboarding (React Native + Node + Prisma + PG)

## 🎯 Objective

Enhance existing React Native app by implementing a Cal AI feature similar to "Cal AI" app with:

- First-time onboarding inside Calorie section
- Ask personal details ONLY once
- Save data in backend (Node + Express + Prisma + PostgreSQL)
- Editable later from Cal AI → Profile section
- Gemini API integration for AI calorie/macro suggestions
- Dark modern UI similar to Cal AI design
- Separate Cal AI profile inside Calorie section (not global profile)

---

# 🧠 APP FLOW

## 1️⃣ First Time User Enters "Calorie" Section

If user.calAiProfile does NOT exist:
→ Show Onboarding Screen

If exists:
→ Go directly to Cal AI Home Screen

Use backend check:
GET /api/cal-ai/profile

If 404 → show onboarding
If 200 → load dashboard

---

# 📱 FRONTEND (React Native)

## 🟣 Navigation Structure

Bottom Tabs (Already Exists):

- Home
- Progress
- Profile
- Calorie (existing)

Inside Calorie Stack:

CalorieStack:

- CalAiHomeScreen
- CalAiOnboardingScreen
- CalAiProfileScreen (edit details)
- AddMealScreen

---

# 🎨 UI DESIGN (Match Cal AI Style)

## Theme:

- Background: dark gradient (#0F0C29 → #24243e)
- Cards: soft rounded 24px borderRadius
- Light shadow
- Minimalistic
- Large bold calorie numbers
- Circular progress rings

Use:

- LinearGradient
- Soft blur cards
- Rounded containers
- Subtle shadows
- Modern typography

---

# 🧾 ONBOARDING FORM (Shown Only First Time)

Collect:

- Goal Weight
- Current Weight
- Height (ft/in or cm)
- Date of Birth
- Gender
- Daily Step Goal

Save to backend.

After save:
→ Navigate to CalAiHomeScreen

Store local flag:
AsyncStorage.setItem("cal_ai_onboarded", "true")

But ALWAYS validate from backend.

---

# 🏠 CAL AI HOME SCREEN

Show:

- Calories left today
- Protein left
- Carbs left
- Fats left
- Day streak
- Recent meals
- Date selector (horizontal like Cal AI)
- Circular calorie progress

Data comes from:
GET /api/cal-ai/dashboard

---

# 👤 CAL AI PROFILE SCREEN

Inside Calorie section only (not global profile).

User can edit:

- Weight
- Goal
- Height
- Step goal

PATCH /api/cal-ai/profile

---

# 🤖 GEMINI AI INTEGRATION

Use Gemini API for:

- Calorie calculation
- Macro breakdown
- Meal analysis

When user adds meal:

POST /api/cal-ai/analyze-meal

Backend sends:

- meal description or image
- user profile data
- goal

Gemini returns:

- calories
- protein
- carbs
- fats

Save meal in DB.

---

# 🗄️ BACKEND (Node + Express + Prisma + PostgreSQL)

## 🧱 Prisma Schema Update

Add new models:

```prisma
model CalAiProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  goalWeight    Float
  currentWeight Float
  height        String
  dateOfBirth   DateTime
  gender        String
  dailyStepGoal Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  meals         CalAiMeal[]
}

model CalAiMeal {
  id         String   @id @default(uuid())
  userId     String
  calories   Int
  protein    Float
  carbs      Float
  fats       Float
  description String
  date       DateTime @default(now())

  user       User @relation(fields: [userId], references: [id])
}
```
