import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please check your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function generateWorkoutPlan(preferences: string, fitnessLevel: string, goals: string, availableEquipment: string[]) {
  const ai = getAI();
  const equipmentContext = availableEquipment.length > 0 
    ? `CRITICAL: The gym ONLY has the following equipment/machines: ${availableEquipment.join(', ')}. 
       You MUST ONLY suggest exercises that can be performed using ONLY these items. 
       If an exercise requires a machine or tool NOT in this list (e.g., if "Dumbbells" are not listed, do not suggest dumbbell exercises), DO NOT suggest it. 
       If the list is very limited, suggest bodyweight exercises that complement the available equipment.`
    : "CRITICAL: The gym currently has NO equipment listed. You MUST ONLY suggest bodyweight exercises (calisthenics). Do not suggest any exercises requiring machines, weights, or tools.";

  const prompt = `Generate a personalized workout plan for a gym member with the following details:
  Fitness Level: ${fitnessLevel}
  Goals: ${goals}
  Preferences: ${preferences}
  
  ${equipmentContext}`;

  console.log("Generating workout plan with prompt:", prompt);

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["name", "sets", "reps"]
              }
            }
          },
          required: ["title", "description", "exercises"]
        }
      }
    });

    console.log("Gemini Response:", response);
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw error;
  }
}

export async function generateAdminInsights(metrics: any) {
  const ai = getAI();
  const prompt = `As an AI Gym Consultant, analyze the following gym metrics and provide 3-4 actionable insights or suggestions to improve the gym's operations, member retention, or revenue.
  
  Metrics:
  - Total Members: ${metrics.totalMembers}
  - Active Members: ${metrics.activeMembers}
  - Halted Members: ${metrics.haltedMembers}
  - Pending Approvals: ${metrics.pendingMembers}
  - Revenue This Month: ₹${metrics.revenueThisMonth}
  - Attendance Today: ${metrics.attendanceToday}
  - Inactive Members (2+ days): ${metrics.atRiskCount}
  
  Provide the response in JSON format with an array of objects, each having a "title" and "suggestion" field.`;

  console.log("Generating admin insights...");

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["title", "suggestion"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });

    console.log("Gemini Insights Response:", response);
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating admin insights:", error);
    return { insights: [] };
  }
}

export async function generateDietPlan(preferences: string, fitnessLevel: string, goals: string) {
  const ai = getAI();
  const prompt = `Generate a personalized Indian diet plan for a gym member with the following details:
  Fitness Level: ${fitnessLevel}
  Goals: ${goals}
  Preferences/Restrictions: ${preferences}
  
  IMPORTANT: The diet plan MUST focus on Indian cuisine (e.g., Dal, Roti, Paneer, Chicken Curry, Poha, Idli, etc.). 
  Provide a full day's meal plan.`;

  console.log("Generating diet plan...");

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "e.g., 8:00 AM, Breakfast" },
                  name: { type: Type.STRING, description: "e.g., High Protein Breakfast" },
                  items: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of food items in the meal"
                  },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["time", "name", "items"]
              }
            }
          },
          required: ["title", "description", "meals"]
        }
      }
    });

    console.log("Gemini Diet Response:", response);
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw error;
  }
}
