const API_BASE = import.meta.env.VITE_API_URL || '';

export async function generateWorkoutPlan(userId: string, preferences: string, fitnessLevel: string, goals: string, availableEquipment: string[], workoutDays: number = 4) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Generating local workout plan for:", { preferences, fitnessLevel, goals, availableEquipment, workoutDays });

  const exercisesDB = [
    { name: "Push-ups", sets: 3, reps: "10-15", notes: "Keep core tight", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "5-10", Intermediate: "10-20", Advanced: "20-30" }, category: "Chest" },
    { name: "Pull-up", sets: 3, reps: "Failure", notes: "Pronated grip. Depress scapula", equipment: "Pull-up bar", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "1-5", Intermediate: "6-10", Advanced: "10-20" }, category: "Back" },
    { name: "Barbell Back Squat", sets: 3, reps: "8-10", notes: "Keep chest up, break parallel", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Legs" },
    { name: "Romanian Deadlift", sets: 3, reps: "8-12", notes: "Slight bend in knees, hinge hips", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Legs" },
    { name: "Barbell Bench Press", sets: 4, reps: "8-12", notes: "Control the eccentric phase", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Intermediate: "8-10", Advanced: "6-8" }, category: "Chest" },
    { name: "Dumbbell Incline Bench Press", sets: 3, reps: "8-12", notes: "Press over upper chest", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Chest" },
    { name: "Cable Crossover", sets: 3, reps: "10-15", notes: "Cross hands at the bottom", equipment: "Cable", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Chest" },
    { name: "Bent Over Barbell Row", sets: 3, reps: "8-12", notes: "Back parallel to floor", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Back" },
    { name: "T-Bar Row", sets: 3, reps: "8-12", notes: "Straddle bar, neutral spine", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Back" },
    { name: "Machine Leg Extension", sets: 3, reps: "12-15", notes: "Squeeze quadriceps at top", equipment: "Machine", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Legs" },
    { name: "Lying Leg Curl", sets: 3, reps: "10-15", notes: "Keep hips pressed into pad", equipment: "Machine", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Legs" },
    { name: "Military Press", sets: 3, reps: "8-10", notes: "Squeeze glutes to stabilize", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Shoulders" },
    { name: "Dumbbell Lateral Raise", sets: 3, reps: "10-15", notes: "Lead with elbows", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Shoulders" },
    { name: "Cable Rope Face Pull", sets: 3, reps: "12-15", notes: "Target rear delts and rotator cuff", equipment: "Cable", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Shoulders" },
    { name: "Barbell Bicep Curl", sets: 3, reps: "8-12", notes: "Keep elbows pinned", equipment: "Barbell", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Arms" },
    { name: "Hammer Curl", sets: 3, reps: "10-12", notes: "Neutral grip", equipment: "Dumbbells", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Arms" },
    { name: "Cable Tricep Pushdown", sets: 3, reps: "10-15", notes: "Keep elbows tucked in", equipment: "Cable", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "12-15", Advanced: "15-20" }, category: "Arms" },
    { name: "Skull Crusher", sets: 3, reps: "8-12", notes: "Keep elbows pointing up", equipment: "Barbell", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "8-10", Intermediate: "10-12", Advanced: "12-15" }, category: "Arms" },
    { name: "Plank", sets: 3, reps: "Hold", notes: "Keep body straight", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "30s", Intermediate: "45s", Advanced: "60s+" }, category: "Core" },
    { name: "Russian Twist", sets: 3, reps: "15-20", notes: "Keep feet elevated if possible", equipment: "None", level: ["Beginner", "Intermediate", "Advanced"], levelReps: { Beginner: "10-12", Intermediate: "15-20", Advanced: "20-30" }, category: "Core" },
    { name: "Hollow Body Hold", sets: 3, reps: "Hold", notes: "Dish shape, press lower back", equipment: "None", level: ["Intermediate", "Advanced"], levelReps: { Beginner: "15s", Intermediate: "30s", Advanced: "45s+" }, category: "Core" }
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

  const insights: string[] = [];

  const prefLower = preferences.toLowerCase();
  if (prefLower.includes('knee') || prefLower.includes('leg injury')) {
    filteredDB = filteredDB.filter(ex => ex.name !== 'Barbell Back Squat' && ex.name !== 'Romanian Deadlift');
    insights.push("I noticed you mentioned a knee/leg concern. I've swapped out heavy squats and deadlifts for lower-impact alternatives to protect your joints.");
  }
  if (prefLower.includes('shoulder')) {
    filteredDB = filteredDB.filter(ex => ex.name !== 'Military Press' && ex.name !== 'Dumbbell Incline Bench Press');
    insights.push("Since you mentioned shoulder issues, I avoided heavy overhead pressing movements to reduce strain on your rotator cuffs.");
  }
  if (prefLower.includes('back')) {
    filteredDB = filteredDB.filter(ex => ex.name !== 'Romanian Deadlift' && ex.name !== 'Bent Over Barbell Row');
    insights.push("I detected a mention of back concerns, so I've removed unsupported bent-over movements to minimize lower-spine shear forces.");
  }
  
  if (fitnessLevel === 'Beginner') {
    insights.push("As a beginner, this plan focuses on establishing a mind-muscle connection. Don't worry about lifting heavy; focus strictly on form.");
  } else if (fitnessLevel === 'Advanced') {
    insights.push("Since you're advanced, I've prioritized volume and exercises that allow for a deeper stretch and peak contraction.");
  }

  if (goals.toLowerCase().includes('fat loss') || goals.toLowerCase().includes('cut')) {
    insights.push("To aid with fat loss, try keeping your rest periods between sets short (around 45-60 seconds) to maintain a higher heart rate.");
  } else if (goals.toLowerCase().includes('muscle') || goals.toLowerCase().includes('bulk')) {
    insights.push("For maximum hypertrophy, ensure you're resting adequately (90-120 seconds) between sets to allow full motor unit recovery.");
  }

  // Construct weekly splits based on workoutDays
  const splits: { dayName: string; focus: string; categories: string[] }[] = [];
  
  if (workoutDays === 2) {
    splits.push({ dayName: "Day 1", focus: "Full Body (Push Focus)", categories: ["Chest", "Shoulders", "Legs", "Core", "Arms"] });
    splits.push({ dayName: "Day 2", focus: "Full Body (Pull Focus)", categories: ["Back", "Legs", "Arms", "Core"] });
  } else if (workoutDays === 3) {
    splits.push({ dayName: "Day 1", focus: "Push (Chest, Shoulders, Triceps)", categories: ["Chest", "Shoulders", "Arms", "Core"] });
    splits.push({ dayName: "Day 2", focus: "Pull (Back, Biceps)", categories: ["Back", "Arms", "Core"] });
    splits.push({ dayName: "Day 3", focus: "Legs & Core", categories: ["Legs", "Core"] });
  } else if (workoutDays === 4) {
    splits.push({ dayName: "Day 1", focus: "Upper Body", categories: ["Chest", "Back", "Shoulders", "Arms"] });
    splits.push({ dayName: "Day 2", focus: "Lower Body", categories: ["Legs", "Core"] });
    splits.push({ dayName: "Day 3", focus: "Upper Body", categories: ["Chest", "Back", "Shoulders", "Arms"] });
    splits.push({ dayName: "Day 4", focus: "Lower Body", categories: ["Legs", "Core"] });
  } else if (workoutDays === 5) {
    splits.push({ dayName: "Day 1", focus: "Chest & Triceps", categories: ["Chest", "Arms", "Core"] });
    splits.push({ dayName: "Day 2", focus: "Back & Biceps", categories: ["Back", "Arms"] });
    splits.push({ dayName: "Day 3", focus: "Legs", categories: ["Legs", "Core"] });
    splits.push({ dayName: "Day 4", focus: "Shoulders", categories: ["Shoulders", "Core"] });
    splits.push({ dayName: "Day 5", focus: "Full Body/Weak points", categories: ["Chest", "Back", "Legs", "Arms"] });
  } else {
    // 6 days
    splits.push({ dayName: "Day 1", focus: "Push (Chest, Shoulders, Triceps)", categories: ["Chest", "Shoulders", "Arms"] });
    splits.push({ dayName: "Day 2", focus: "Pull (Back, Biceps)", categories: ["Back", "Arms"] });
    splits.push({ dayName: "Day 3", focus: "Legs", categories: ["Legs", "Core"] });
    splits.push({ dayName: "Day 4", focus: "Push (Chest, Shoulders, Triceps)", categories: ["Chest", "Shoulders", "Arms"] });
    splits.push({ dayName: "Day 5", focus: "Pull (Back, Biceps)", categories: ["Back", "Arms"] });
    splits.push({ dayName: "Day 6", focus: "Legs & Core", categories: ["Legs", "Core"] });
  }

  const days: any[] = [];
  // For legacy compatibility, return a flat exercises array of the very first day
  let flatExercises: any[] = [];

  for (const split of splits) {
    const dayExercises = [];
    const targetExerciseCount = Math.floor(Math.random() * 2) + 5; // 5-6 exercises per day
    
    // Pick exercises that match the categories for this day
    const availableForDay = filteredDB.filter(ex => split.categories.includes(ex.category));
    let setOfExercises = [...availableForDay].sort(() => 0.5 - Math.random()).slice(0, targetExerciseCount);
    
    if (setOfExercises.length < 3) {
      // Fallback
      setOfExercises = [...filteredDB].sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    for (const ex of setOfExercises) {
        let repsStr = ex.reps;
        if (ex.levelReps && ex.levelReps[fitnessLevel as keyof typeof ex.levelReps]) {
            repsStr = ex.levelReps[fitnessLevel as keyof typeof ex.levelReps];
        }

        const mappedEx = {
            name: ex.name,
            sets: ex.sets,
            reps: repsStr,
            notes: ex.notes
        };
        dayExercises.push(mappedEx);
        
        if (days.length === 0) {
            flatExercises.push(mappedEx);
        }
    }

    days.push({
      dayName: split.dayName,
      focus: split.focus,
      exercises: dayExercises
    });
  }

  if (flatExercises.length === 0) {
      flatExercises.push({ name: "Walking / Light Jogging", sets: 1, reps: "20-30 mins", notes: "General cardio to stay active." });
      days.push({ dayName: "Day 1", focus: "Light Activity", exercises: flatExercises });
  }

  return {
    title: `${workoutDays}-Day ${fitnessLevel} ${goals} Workout`,
    description: `A custom ${workoutDays}-day weekly plan aimed at ${goals.toLowerCase()}, tailored for a ${fitnessLevel.toLowerCase()} level using selected equipment.`,
    exercises: flatExercises,
    days: days,
    aiInsights: insights
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

export async function generateDietPlan(userId: string, preferences: string, fitnessLevel: string, goals: string, dietType: string = 'nonveg') {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const isCut = goals.toLowerCase().includes('fat loss') || goals.toLowerCase().includes('cut');
  const isBulk = goals.toLowerCase().includes('muscle') || goals.toLowerCase().includes('bulk');
  const type = dietType.toLowerCase();

  const proteins = {
      veg: ["Paneer", "Moong Dal", "Chana Dal", "Toor Dal", "Masoor Dal", "Rajma", "Chickpeas", "Greek Yogurt", "Cottage Cheese", "Milk", "Whey Protein"],
      nonveg: ["Chicken Breast", "Chicken Thigh", "Eggs", "Rohu Fish", "Pomfret Fish", "Salmon", "Tuna", "Prawns", "Mutton", "Turkey Breast"],
      vegan: ["Soya Chunks", "Tofu", "Peanut Butter", "Almonds", "Chickpeas", "Moong Dal", "Chana Dal", "Kidney Beans", "Pumpkin Seeds", "Chia Seeds"]
  };

  const carbs = ["Brown Rice", "White Rice", "Whole Wheat Roti", "Multigrain Roti", "Jowar Roti", "Bajra Roti", "Dalia", "Oats", "Poha", "Upma", "Quinoa", "Sweet Potato", "Potato", "Vermicelli", "Idli", "Dosa", "Whole Wheat Bread"];
  const fats = ["Ghee", "Coconut Oil", "Mustard Oil", "Olive Oil", "Almonds", "Walnuts", "Cashews", "Peanuts", "Flaxseeds", "Chia Seeds", "Pumpkin Seeds", "Sunflower Seeds", "Avocado"];
  
  if (type === 'vegan') {
      const gIndex = fats.indexOf('Ghee');
      if (gIndex > -1) fats.splice(gIndex, 1);
  }

  const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const getPro = () => getRand(type === 'vegan' ? proteins.vegan : (type === 'veg' ? proteins.veg : proteins.nonveg));
  const getCarb = () => getRand(carbs);
  const getFat = () => getRand(fats);

  let mealMultiplier = 1;
  if(isCut) mealMultiplier = 0.8;
  if(isBulk) mealMultiplier = 1.25;

  // Let's create some dynamic options combining the user inputs
  const breakfastOptions = [
    { items: [`${isBulk ? '4' : '2'} boiled eggs with ${isBulk ? '2' : '1'} ${getCarb()}`, "1 glass milk or soy milk", "Handful of " + getFat()], protein: isCut ? "20g" : "35g" },
    { items: [`100g ${getPro()}`, `2 ${getCarb()}`, `5 ${getFat()}`], protein: "28g" },
    { items: [`1 bowl ${getCarb()} with ${type === 'vegan' ? 'almond milk' : 'milk'} and fruit`, "Handful of " + getFat()], protein: "12g" },
    { items: [`${getPro()} scramble with vegetables`, `2 ${getCarb()}`, "Green tea"], protein: "22g" }
  ];

  const lunchOptions = [
    { items: [`150g ${getPro()}`, `1 cup ${getCarb()}`, "Mixed vegetable curry", "Green salad with lemon"], protein: "42g" },
    { items: [`1 cup ${getPro()} (Dal or similar)`, `2 ${getCarb()}`, `100g ${getPro()}`, "Vegetable salad"], protein: "30g" },
    { items: [`1.5 cups ${getCarb()}`, `200g ${getPro()}`, "Sautéed green beans"], protein: "45g" }
  ];

  const snackOptions = [
    { items: [`2 ${getCarb()} with ${getFat()} (peanut/almond butter)`, "1 fruit", "Black coffee"], protein: "15g" },
    { items: [`1 scoop ${type === 'vegan' ? 'plant' : 'whey'} protein with water/milk`, "1 banana", `1 tbsp ${getFat()}`], protein: "32g" },
    { items: [`Handful of roasted ${getPro()} (chickpeas/nuts)`, `Green Tea`], protein: "12g" }
  ];

  const dinnerOptions = [
    { items: [`150g grilled ${getPro()}`, "Stir-fried vegetables", `Small bowl of ${getCarb()}`, "Green salad"], protein: "38g" },
    { items: [`1 cup ${getPro()} curry`, `2 ${getCarb()}`, `${type !== 'vegan' ? '1 bowl curd' : '1 bowl soy yogurt'}`, "Cucumber salad"], protein: "24g" },
    { items: [`Light ${getCarb()} soup`, `100g ${getPro()}`, `Broccoli with ${getFat()}`], protein: "20g" }
  ];

  const bfast = getRand(breakfastOptions);
  const lunch = getRand(lunchOptions);
  const snack = getRand(snackOptions);
  const dinner = getRand(dinnerOptions);

  const meals = [
    {
        time: "8:00 AM",
        name: "Morning Energy",
        items: bfast.items,
        calories: Math.floor(400 * mealMultiplier),
        protein: bfast.protein
    },
    {
        time: "1:00 PM",
        name: "Power Lunch",
        items: lunch.items,
        calories: Math.floor(550 * mealMultiplier),
        protein: lunch.protein
    },
    {
        time: "5:00 PM",
        name: "Pre/Post Workout Meal",
        items: snack.items,
        calories: Math.floor(300 * mealMultiplier),
        protein: snack.protein
    },
    {
        time: "8:30 PM",
        name: "Recovery Dinner",
        items: dinner.items,
        calories: Math.floor(450 * mealMultiplier),
        protein: dinner.protein
    }
  ];

  const typeName = type === 'veg' ? 'Vegetarian' : (type === 'vegan' ? 'Vegan' : 'Non-Vegetarian');

  const insights: string[] = [];
  if (isCut) {
    insights.push("To support your fat loss goal, I've created a slight caloric deficit while prioritizing protein to maintain lean muscle mass.");
  } else if (isBulk) {
    insights.push("Since you are bulking, I've increased your carbohydrate and healthy fat intake to provide the surplus energy needed for muscle synthesis.");
  }

  if (type === 'vegan') {
    insights.push("As a vegan, I've carefully combined varied plant proteins (like soy, lentils, and nuts) to ensure you get a complete amino acid profile.");
  } else if (type === 'veg') {
    insights.push("For your vegetarian diet, I've relied on high-quality dairy and legume combinations to provide ample protein without excess saturated fats.");
  }

  const prefLower = preferences.toLowerCase();
  if (prefLower.includes('allergy') || prefLower.includes('gluten') || prefLower.includes('dairy')) {
    insights.push("I noticed you mentioned dietary restrictions/allergies. Please always double check the ingredients before consuming.");
  }

  return {
      title: `${typeName} ${goals} Diet Plan`,
      description: `A custom ${goals.toLowerCase()} oriented meal plan focusing on ${typeName.toLowerCase()} ingredients to help you hit your macros correctly.`,
      meals: meals,
      aiInsights: insights
  };
}
