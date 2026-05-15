const API_BASE = import.meta.env.VITE_API_URL || '';

export async function generateWorkoutPlan(userId: string, preferences: string, fitnessLevel: string, goals: string, availableEquipment: string[]) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Generating local workout plan for:", { preferences, fitnessLevel, goals, availableEquipment });

  const exercisesDB = [
    { name: "Push-ups", sets: 3, reps: "10-15", notes: "Keep core tight", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "5-10", Intermediate: "10-15", Advanced: "15-25" } },
    { name: "Pull-ups", sets: 3, reps: "5-10", notes: "Full range of motion", equipment: "Pull-up bar", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "3-8", Advanced: "8-12" } },
    { name: "Bodyweight Squats", sets: 3, reps: "15-20", notes: "Knees over toes", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10", Intermediate: "15-20", Advanced: "20-30" } },
    { name: "Dumbbell Shrugs", sets: 3, reps: "12-15", notes: "Squeeze traps at top", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10", Intermediate: "12-15", Advanced: "15-20" } },
    { name: "Barbell Bench Press", sets: 4, reps: "8-12", notes: "Control the eccentric phase", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "8-10", Advanced: "6-8" } },
    { name: "Dumbbell Flyes", sets: 3, reps: "10-12", notes: "Slight bend in elbows", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10", Intermediate: "10-12", Advanced: "12-15" } },
    { name: "Barbell Squats", sets: 4, reps: "6-10", notes: "Break parallel if possible", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "8-10", Advanced: "5-8" } },
    { name: "Dumbbell Lunges", sets: 3, reps: "10 per leg", notes: "Keep chest up", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8 per leg", Intermediate: "10 per leg", Advanced: "12 per leg" } },
    { name: "Deadlifts", sets: 3, reps: "5-8", notes: "Keep back straight, lift with legs", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "5-8", Advanced: "3-5" } },
    { name: "Lat Pulldowns", sets: 3, reps: "10-12", notes: "Pull to upper chest", equipment: "Cable machine", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "8-12", Advanced: "8-10" } },
    { name: "Plank", sets: 3, reps: "60s", notes: "Don't let hips sag", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "30s", Intermediate: "60s", Advanced: "90s" } },
    { name: "Russian Twists", sets: 3, reps: "20 twists", notes: "Twist from torso, not just arms", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10 twists", Intermediate: "20 twists", Advanced: "30 twists" } },
    { name: "Bicep Curls", sets: 3, reps: "10-12", notes: "Keep elbows pinned", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "8-12", Advanced: "8-10" } },
    { name: "Tricep Dips", sets: 3, reps: "10-15", notes: "Lower until arms are 90 degrees", equipment: "None", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "8-12", Advanced: "12-20" } }
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
      veg: ["Paneer (Cottage Cheese)", "Tofu", "Lentils (Dal)", "Chickpeas (Chana)", "Greek Yogurt (Dahi)", "Soya Chunks"],
      nonveg: ["Chicken Breast", "Eggs", "Fish (Rohu/Salmon)", "Lean Mutton", "Chicken Kheema"],
      vegan: ["Tofu", "Lentils (Dal)", "Chickpeas (Chana)", "Soya Chunks", "Moong Dal Sprouts"]
  };

  const carbs = ["Brown Rice", "Roti (Whole Wheat)", "Oats", "Sweet Potato", "Quinoa", "Dalia (Broken Wheat)"];
  const fats = ["Almonds & Walnuts", "Ghee (Clarified Butter)", "Peanut Butter", "Avocado", "Olive Oil", "Coconut chunks"];
  
  if (isVegan) fats[1] = "Flaxseeds"; // Replace Ghee with flaxseeds

  const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const getPro = () => getRand(isVegan ? proteins.vegan : (isVeg ? proteins.veg : proteins.nonveg));
  const getCarb = () => getRand(carbs);
  const getFat = () => getRand(fats);

  let mealMultiplier = 1;
  if(isCut) mealMultiplier = 0.8;
  if(isBulk) mealMultiplier = 1.25;

  const meals = [
    {
        time: "8:00 AM",
        name: "Morning Fuel (Breakfast)",
        items: [
            isVeg ? "Poha with peanuts or Upma" : "3 Whole Eggs Scrambled or Omelete",
            isBulk ? getCarb() + " Porridge" : "1 Apple or Papaya bowl",
            "1 cup Green Tea or Black Coffee"
        ],
        calories: Math.floor(350 * mealMultiplier),
        protein: isVeg ? "10g" : "20g"
    },
    {
        time: "1:00 PM",
        name: "Power Lunch",
        items: [
            `${isBulk ? '2 cups' : '1 cup'} ${getCarb()}`,
            `${isBulk ? '200g' : '150g'} ${getPro()}`,
            "Mixed Vegetable Sabzi (low oil)",
            "Cucumber & Tomato Salad"
        ],
        calories: Math.floor(500 * mealMultiplier),
        protein: isVeg ? "20g" : "35g"
    },
    {
        time: "5:00 PM",
        name: "Pre-Workout Snack",
        items: [
            "Handful of " + getFat(),
            isBulk ? "2 Bananas" : "1 Banana",
            isVeg ? "1 scoop Whey/Plant Protein (optional)" : "2 Boiled Egg Whites"
        ],
        calories: Math.floor(250 * mealMultiplier),
        protein: "15g"
    },
    {
        time: "8:30 PM",
        name: "Recovery Dinner",
        items: [
            `${isCut ? '0.5 cup' : '1.5 cups'} ${getCarb()}`,
            `${isBulk ? '250g' : '150g'} ${getPro()}`,
            isVegan ? "Stir-fried broccoli" : "Small bowl of Curd (Dahi)"
        ],
        calories: Math.floor(400 * mealMultiplier),
        protein: isVeg ? "25g" : "40g"
    }
  ];

  return {
      title: `Indian ${isVeg ? 'Vegetarian ' : (isVegan ? 'Vegan ' : '')}${isBulk ? 'Muscle Building' : (isCut ? 'Fat Loss' : 'Fitness')} Diet`,
      description: `A highly nutritious Indian meal plan focusing on local ingredients to help you achieve your ${goals.toLowerCase()} goals. Remember to stay hydrated and sleep well!`,
      meals: meals
  };
}
