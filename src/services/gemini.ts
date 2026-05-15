export async function generateWorkoutPlan(userId: string, preferences: string, fitnessLevel: string, goals: string, availableEquipment: string[]) {
  const response = await fetch('/api/ai/workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, preferences, fitnessLevel, goals, availableEquipment })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate workout plan');
  return data;
}

export async function generateAdminInsights(metrics: any) {
  const response = await fetch('/api/ai/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics })
  });
  if (!response.ok) return { insights: [] };
  return response.json();
}

export async function generateDietPlan(userId: string, preferences: string, fitnessLevel: string, goals: string) {
  const response = await fetch('/api/ai/diet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, preferences, fitnessLevel, goals })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate diet plan');
  return data;
}
