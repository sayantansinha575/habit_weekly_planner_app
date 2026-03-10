import { prisma } from "./prisma";
import "dotenv/config";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyC0zGnG5zkQQ9gwZJkrvjkfVgIR4a2_LW0";
// const MODEL_NAME = "gemini-3-flash-preview";
const MODEL_NAME = "gemini-3-flash-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

export const getCalAiProfile = async (userId: string) => {
  return await prisma.calAiProfile.findUnique({
    where: { userId },
  });
};

export const updateCalAiProfile = async (userId: string, data: any) => {
  return await prisma.calAiProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
    },
    update: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });
};

const calculateDailyTargets = (profile: any) => {
  const {
    currentWeight,
    goalWeight,
    height,
    dateOfBirth,
    gender,
    dailyStepGoal,
  } = profile;
  const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  const heightNum = parseFloat(height);

  // Mifflin-St Jeor Equation
  let bmr = 10 * currentWeight + 6.25 * heightNum - 5 * age;
  if (gender === "Male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity Multiplier based on step goal
  let multiplier = 1.2; // Sedentary
  if (dailyStepGoal >= 12000)
    multiplier = 1.9; // Extra Active
  else if (dailyStepGoal >= 10000)
    multiplier = 1.725; // Very Active
  else if (dailyStepGoal >= 7500)
    multiplier = 1.55; // Moderate
  else if (dailyStepGoal >= 5000) multiplier = 1.375; // Lightly Active

  let tdee = bmr * multiplier;

  // Goal adjustment
  let dailyTarget = tdee;
  if (goalWeight < currentWeight) {
    dailyTarget -= 500; // Calorie deficit for weight loss
  } else if (goalWeight > currentWeight) {
    dailyTarget += 300; // Calorie surplus for muscle gain
  }

  dailyTarget = Math.max(1200, Math.round(dailyTarget)); // Health safety floor

  // Macro Splits (30% P, 40% C, 30% F)
  const proteinTarget = Math.round((dailyTarget * 0.3) / 4);
  const carbsTarget = Math.round((dailyTarget * 0.4) / 4);
  const fatsTarget = Math.round((dailyTarget * 0.3) / 9);

  return { dailyTarget, proteinTarget, carbsTarget, fatsTarget };
};

export const getCalAiDashboard = async (userId: string) => {
  const profile = await prisma.calAiProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const meals = await prisma.calAiMeal.findMany({
    where: {
      userId,
      // date: {
      //   gte: today,
      // },
    },
  });

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);

  const { dailyTarget, proteinTarget, carbsTarget, fatsTarget } =
    calculateDailyTargets(profile);

  const caloriesLeft = dailyTarget - totalCalories;

  // Dedicated Calorie Streak Logic
  let currentStreak = (profile as any).streak || 0;
  const lastUpdate = (profile as any).lastStreakUpdate
    ? new Date((profile as any).lastStreakUpdate)
    : null;
  if (lastUpdate) lastUpdate.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // If goal met today
  if (caloriesLeft <= 0) {
    if (!lastUpdate || lastUpdate.getTime() < today.getTime()) {
      let newStreak = 1;
      if (lastUpdate && lastUpdate.getTime() === yesterday.getTime()) {
        newStreak = currentStreak + 1;
      }

      const updatedProfile = await prisma.calAiProfile.update({
        where: { userId },
        data: {
          streak: newStreak,
          lastStreakUpdate: today,
        } as any,
      });
      currentStreak = (updatedProfile as any).streak;
    }
  } else {
    // Goal not met today yet, check if yesterday was missed to reset streak
    if (lastUpdate && lastUpdate.getTime() < yesterday.getTime()) {
      const updatedProfile = await prisma.calAiProfile.update({
        where: { userId },
        data: { streak: 0 } as any,
      });
      currentStreak = (updatedProfile as any).streak;
    }
  }

  return {
    caloriesLeft: Math.max(0, caloriesLeft),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
    dailyTarget,
    proteinTarget,
    carbsTarget,
    fatsTarget,
    meals,
    streak: currentStreak,
  };
};

// export const analyzeMeal = async (
//   userId: string,
//   description: string,
//   imageBase64?: string,
// ) => {
//   try {
//     const prompt = `Analyze this meal and provide nutritional information.
//     If there is a description: "${description}".
//     Provide the response strictly in JSON format with the following keys:
//     {
//       "calories": number,
//       "protein": number,
//       "carbs": number,
//       "fats": number,
//       "description": "short descriptive name of the meal"
//     }
//     If you cannot determine the meal, estimate based on common portions.`;

//     const contents = [
//       {
//         parts: [
//           { text: prompt },
//           ...(imageBase64
//             ? [
//                 {
//                   inline_data: {
//                     mime_type: "image/jpeg",
//                     data: imageBase64,
//                   },
//                 },
//               ]
//             : []),
//         ],
//       },
//     ];

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ contents }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
//     }

//     const data = await response.json();
//     const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

//     if (!text) throw new Error("Empty response from AI");

//     // Extract JSON from response
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) throw new Error("Could not parse AI response as JSON");

//     const analysis = JSON.parse(jsonMatch[0]);

//     // Save to DB
//     const meal = await prisma.calAiMeal.create({
//       data: {
//         userId,
//         calories: analysis.calories,
//         protein: analysis.protein,
//         carbs: analysis.carbs,
//         fats: analysis.fats,
//         description: analysis.description || description,
//       },
//     });

//     return meal;
//   } catch (error) {
//     console.error("AI Analysis failed:", error);
//     throw error;
//   }
// };

export const analyzeMeal = async (
  userId: string,
  description: string,
  imageBase64?: string,
) => {
  try {
    // 🔥 Call Railway AI Service instead of Gemini directly
    const aiResponse = await fetch(
      process.env.AI_SERVICE_URL!, // railway url
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "x-internal-secret": process.env.AI_INTERNAL_SECRET!, // optional security
        },
        body: JSON.stringify({
          description,
          imageBase64,
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI Service error: ${aiResponse.status} - ${errorText}`);
    }

    const analysis = await aiResponse.json();

    if (!analysis) throw new Error("Empty response from AI");

    // Depth analysis / reasoning logging
    if (analysis.reasoning) {
      console.info(
        "Meal Analysis Reasoning:",
        JSON.stringify(analysis.reasoning, null, 2),
      );
    }

    // ✅ Save to DB (THIS STAYS IN RENDER)
    const meal = await prisma.calAiMeal.create({
      data: {
        userId,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        description: analysis.description || description,
      },
    });

    return meal;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};

export const getCalAiProgress = async (userId: string, days: number = 7) => {
  const profile: any = await (prisma.calAiProfile as any).findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!profile) return null;

  // Last X days calories
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const allMeals = await prisma.calAiMeal.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStr = d.toISOString().split("T")[0];

    const dayMeals = allMeals.filter((m) => {
      const mDate = new Date(m.date);
      mDate.setHours(0, 0, 0, 0);
      return mDate.toISOString().split("T")[0] === dayStr;
    });

    const totalCals = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    chartData.push({ date: dayStr, calories: totalCals });
  }

  // Simple BMI: Weight (kg) / [Height (m)]^2
  const heightInMeters = parseFloat(profile.height) / 100;
  const bmi = profile.currentWeight / (heightInMeters * heightInMeters);

  let bmiCategory = "Healthy";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = "Overweight";
  else if (bmi >= 30) bmiCategory = "Obese";

  return {
    currentWeight: profile.currentWeight,
    goalWeight: profile.goalWeight,
    bmi: parseFloat(bmi.toFixed(2)),
    bmiCategory,
    chartData,
    streak: (profile as any).streak || 0,
    updatedAt: profile.updatedAt,
  };
};

export const resetTodayMeals = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.calAiMeal.deleteMany({
    where: {
      userId,
      // date: {
      //   gte: today,
      // },
    },
  });
};
