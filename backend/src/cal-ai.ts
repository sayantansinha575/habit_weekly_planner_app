import { prisma } from "./prisma";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyC0zGnG5zkQQ9gwZJkrvjkfVgIR4a2_LW0";
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
      date: {
        gte: today,
      },
    },
  });

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);

  // Daily target check (can be dynamic based on profile in future)
  const dailyTarget = 2000;

  return {
    caloriesLeft: dailyTarget - totalCalories,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
    meals,
    streak: 0,
  };
};

export const analyzeMeal = async (
  userId: string,
  description: string,
  imageBase64?: string,
) => {
  try {
    const prompt = `Analyze this meal and provide nutritional information. 
    If there is a description: "${description}".
    Provide the response strictly in JSON format with the following keys:
    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "description": "short descriptive name of the meal"
    }
    If you cannot determine the meal, estimate based on common portions.`;

    const contents = [
      {
        parts: [
          { text: prompt },
          ...(imageBase64
            ? [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ]
            : []),
        ],
      },
    ];

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty response from AI");

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response as JSON");

    const analysis = JSON.parse(jsonMatch[0]);

    // Save to DB
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
