const API_BASE = import.meta.env.VITE_API_URL || '';

export async function generateWorkoutPlan(userId: string, preferences: string, fitnessLevel: string, goals: string, availableEquipment: string[]) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Generating local workout plan for:", { preferences, fitnessLevel, goals, availableEquipment });

  const exercisesDB = [
    { name: "Push-ups", sets: 3, reps: "10-15", notes: "Keep core tight", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "5-10", Intermediate: "10-20", Advanced: "20-30" } },
    { name: "Pull-up", sets: 3, reps: "Failure", notes: "Pronated grip. Depress scapula", equipment: "Pull-up bar", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "1-5", Intermediate: "6-10", Advanced: "10-20" } },
    { name: "Barbell Back Squat", sets: 3, reps: "8-10", notes: "Keep chest up, break parallel", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Romanian Deadlift", sets: 3, reps: "8-12", notes: "Slight bend in knees, hinge hips", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Barbell Bench Press", sets: 4, reps: "8-12", notes: "Control the eccentric phase", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "8-10", Advanced: "6-8" } },
    { name: "Dumbbell Incline Bench Press", sets: 3, reps: "8-12", notes: "Press over upper chest", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Cable Crossover", sets: 3, reps: "10-15", notes: "Cross hands at the bottom", equipment: "Cable", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Bent Over Barbell Row", sets: 3, reps: "8-12", notes: "Back parallel to floor", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "T-Bar Row", sets: 3, reps: "8-12", notes: "Straddle bar, neutral spine", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Machine Leg Extension", sets: 3, reps: "12-15", notes: "Squeeze quadriceps at top", equipment: "Machine", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Lying Leg Curl", sets: 3, reps: "10-15", notes: "Keep hips pressed into pad", equipment: "Machine", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Military Press", sets: 3, reps: "8-10", notes: "Squeeze glutes to stabilize", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Dumbbell Lateral Raise", sets: 3, reps: "10-15", notes: "Lead with elbows", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Cable Rope Face Pull", sets: 3, reps: "12-15", notes: "Target rear delts and rotator cuff", equipment: "Cable", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Barbell Bicep Curl", sets: 3, reps: "8-12", notes: "Keep elbows pinned", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Hammer Curl", sets: 3, reps: "10-12", notes: "Neutral grip", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Cable Tricep Pushdown", sets: 3, reps: "10-15", notes: "Keep elbows tucked in", equipment: "Cable", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Skull Crusher", sets: 3, reps: "8-12", notes: "Keep elbows pointing up", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Plank", sets: 3, reps: "Hold", notes: "Keep body straight", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "30s", Intermediate: "45s", Advanced: "60s+" } },
    { name: "Russian Twist", sets: 3, reps: "15-20", notes: "Keep feet elevated if possible", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "15-20", Advanced: "20-30" } },
    { name: "Hollow Body Hold", sets: 3, reps: "Hold", notes: "Dish shape, press lower back", equipment: "None", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "15s", Intermediate: "30s", Advanced: "45s+" } }
  ];

  // Filter exercises by equipment and fitness level
  let filteredDB = exercisesDB.filter(ex => ex.level.includes(fitnessLevel));
  
  if (availableEquipment && availableEquipment.length > 0 && availableEquipment[0].toLowerCase() !== 'none') {
      const equipSet = new Set(availableEquipment.map(e => e.toLowerCase()));
      // Always include 'none' (bodyweight) exercises
      filteredDB = filteredDB.filter(ex => ex.equipment.toLowerCase() === 'none' || equipSet.has(ex.equipment.toLowerCase()) || equipSet.has('full gym'));
  } else {
      // Only bodyweight
      filteredDB = filteredDB.filter(ex => ex.equipment.toLowerCase() === 'none');
  }

  // Pick 5-7 exercises randomly
  const planExercises = [];
  const targetExerciseCount = Math.min(filteredDB.length, Math.floor(Math.random() * 3) + 5); 
  const shuffled = [...filteredDB].sort(() => 0.5 - Math.random());

  for(let i = 0; i < targetExerciseCount; i++) {
      const ex = shuffled[i];
      let repsStr = ex.reps;
      if (ex.levelReps && ex.levelReps[fitnessLevel as keyof typeof ex.levelReps]) {
          repsStr = ex.levelReps[fitnessLevel as keyof typeof ex.levelReps];
      }

      planExercises.push({
          name: ex.name,
          sets: ex.sets,
          reps: repsStr,
          notes: ex.notes
      });
  }

  if (planExercises.length === 0) {
      planExercises.push({ name: "Walking / Light Jogging", sets: 1, reps: "20-30 mins", notes: "General cardio to stay active." });
  }

  return {
    title: `${fitnessLevel} ${goals} Workout`,
    description: `A custom plan aimed at ${goals.toLowerCase()}, tailored for a ${fitnessLevel.toLowerCase()} level using selected equipment.`,
    exercises: planExercises
  };
}

export async function generateAdminInsights(metrics: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const insights = [];

  const { activeUsers = 0, totalUsers = 0, recentSignups = 0 } = metrics;
  const activeRatio = (activeUsers / (totalUsers || 1)) * 100;

  if (activeRatio < 50) {
      insights.push("Engagement Alert: Active user ratio is below 50%. Consider launching a challenge or push notification campaign to re-engage inactive members.");
  } else {
      insights.push("Great Engagement: Over 50% of your user base is active. Keep up the good work with current member retention strategies.");
  }

  if (recentSignups > 10) {
      insights.push("Growth Trend: High number of recent signups. Ensure your onboarding process is welcoming and efficient to retain these new members.");
  } else {
      insights.push("Growth Opportunity: Recent signups have been slow. Consider offering a referral program or a temporary discount on memberships.");
  }

  insights.push("Class Popularity: Review attendance logs to see which group classes are most popular, and consider adding more slots for them.");
  insights.push("Equipment Maintenance: based on general gym trends, ensure cardio equipment like treadmills have scheduled periodic maintenance.");

  return { insights };
}

export async function generateDietPlan(userId: string, preferences: string, fitnessLevel: string, goals: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const isVeg = preferences.toLowerCase().includes('veg');
  const isCut = goals.toLowerCase().includes('weight loss') || goals.toLowerCase().includes('cut');
  const isBulk = goals.toLowerCase().includes('muscle') || goals.toLowerCase().includes('bulk');
  const isVegan = preferences.toLowerCase().includes('vegan');

  const proteins = {
      veg: ["Paneer Bhurji", "Chana Masala", "Masoor Dal & Jowar", "Toor Dal", "Greek Yogurt (Hung Curd)"],
      nonveg: ["Chicken Tangdi", "Rohu Fish Curry", "Mackerel", "Goshtaba (Mutton)", "Chicken Tikka", "Keralan Grilled Fish"],
      vegan: ["Soy Chunks (Nutri Nuggets)", "Tofu", "Tempeh", "Edamame", "Sprouted Moong Beans", "Palak Tofu", "Soya Keema"]
  };

  const carbs = ["Brown Rice", "Jowar Roti", "Bajra Roti", "Ragi", "Dalia (Broken Wheat)", "Rolled Oats", "Quinoa"];
  const fats = ["Ghee (Clarified Butter)", "Kashmiri Walnuts", "Mamra Almonds", "Flaxseeds", "Chia Seeds", "Mustard Oil"];
  
  if (isVegan) fats[0] = "Coconut Oil"; // Replace Ghee with Coconut oil

  const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const getPro = () => getRand(isVegan ? proteins.vegan : (isVeg ? proteins.veg : proteins.nonveg));
  const getCarb = () => getRand(carbs);
  const getFat = () => getRand(fats);

  let mealMultiplier = 1;
  if(isCut) mealMultiplier = 0.8;
  if(isBulk) mealMultiplier = 1.25;

  const breakfastOptions = [
    { items: ["Moong Dal Chilla (Savory green lentil pancake)", "Mint Chutney", "Black Coffee / Green Tea"], protein: "15g" },
    { items: ["Paneer Bhurji", "Whole Wheat Toast", "Greek Yogurt"], protein: "20g" },
    { items: ["Masala Oats mixed with fibrous vegetables", "Handful of " + getFat()], protein: "12g" }
  ];

  const lunchOptions = [
    { items: ["Chana Masala", "Brown Rice", "Cucumber & Tomato Salad", "Roasted Makhana"], protein: "18g" },
    { items: ["Chicken Tikka", "Large Cucumber Salad", "1 Jowar Roti"], protein: "35g" },
    { items: ["Palak Tofu", "Quinoa", "Mixed Vegetables"], protein: "20g" },
    { items: ["Keralan-inspired Grilled Fish Curry", "Sautéed Vegetables", "1 Bajra Roti"], protein: "30g" }
  ];

  const snackOptions = [
    { items: ["Dry-roasted Chana", "Green Tea"], protein: "19g" },
    { items: ["Sprouted Moong Chaat", "Lemon juice & spices"], protein: "12g" },
    { items: ["Roasted Makhana (Fox nuts)", "Handful of " + getFat()], protein: "8g" },
    { items: ["Peanut Chikki (with jaggery)", "Pre-workout energy"], protein: "10g" }
  ];

  const dinnerOptions = [
    { items: ["Tofu Stir-fry", "Minimal Portion of Quinoa", "Sautéed Broccoli"], protein: "18g" },
    { items: ["Robust Soya Keema", "Single Bajra Roti", "Side Salad"], protein: "25g" },
    { items: ["Dal Khichdi enriched with Ghee", "Small dollop of Curd (Dahi)"], protein: "15g" },
    { items: ["Lean Mutton/Chicken portion", "Fibrous Vegetables", "Flaxseeds"], protein: "35g" }
  ];

  const bfast = getRand(breakfastOptions);
  const lunch = getRand(lunchOptions);
  const snack = getRand(snackOptions);
  const dinner = getRand(dinnerOptions);

  const meals = [
    {
        time: "8:00 AM",
        name: "Morning Fuel (Breakfast)",
        items: bfast.items,
        calories: Math.floor(350 * mealMultiplier),
        protein: bfast.protein
    },
    {
        time: "1:00 PM",
        name: "Power Lunch",
        items: lunch.items,
        calories: Math.floor(500 * mealMultiplier),
        protein: lunch.protein
    },
    {
        time: "5:00 PM",
        name: "Pre-Workout Snack",
        items: snack.items,
        calories: Math.floor(250 * mealMultiplier),
        protein: snack.protein
    },
    {
        time: "8:30 PM",
        name: "Recovery Dinner",
        items: dinner.items,
        calories: Math.floor(400 * mealMultiplier),
        protein: dinner.protein
    }
  ];

  return {
      title: `Indian ${isVeg ? 'Vegetarian ' : (isVegan ? 'Vegan ' : '')}${isBulk ? 'Muscle Building' : (isCut ? 'Fat Loss' : 'Fitness')} Diet`,
      description: `A highly nutritious Indian meal plan focusing on local ingredients to help you achieve your ${goals.toLowerCase()} goals. Remember to stay hydrated and sleep well!`,
      meals: meals
  };
}
