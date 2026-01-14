import { Recipe } from '../types';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export const fetchRecipesByName = async (name: string): Promise<Recipe[]> => {
  const response = await fetch(`${BASE_URL}/search.php?s=${name}`);
  const data = await response.json();
  return data.meals || [];
};

export const fetchRandomRecipe = async (): Promise<Recipe | null> => {
  const response = await fetch(`${BASE_URL}/random.php`);
  const data = await response.json();
  return data.meals ? data.meals[0] : null;
};

export const fetchCategories = async (): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/list.php?c=list`);
  const data = await response.json();
  return data.meals ? data.meals.map((m: any) => m.strCategory) : [];
};

export const fetchRecipesByCategory = async (category: string): Promise<Recipe[]> => {
  const response = await fetch(`${BASE_URL}/filter.php?c=${category}`);
  const data = await response.json();
  return data.meals || [];
};

export const fetchRecipeById = async (id: string): Promise<Recipe | null> => {
  const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
  const data = await response.json();
  return data.meals ? data.meals[0] : null;
};

export const getIngredients = (recipe: Recipe): { name: string; measure: string }[] => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name, measure });
    }
  }
  return ingredients;
};

export const formatInstructions = (instructions: string): string[] => {
  if (!instructions) return [];
  
  // Clean up common TheMealDB artifacts
  const cleaned = instructions
    .replace(/Step \d+:?/gi, '')
    .replace(/\r\n/g, '\n');

  return cleaned
    .split(/\n|(?<=[.!?])\s+/)
    .map(step => step.trim())
    .filter(step => step.length > 3 && !/^(\d+\.|\d+\)|[•\-\*])$/.test(step));
};

export const estimateRecipeStats = (recipe: Recipe) => {
  const ingredientsCount = getIngredients(recipe).length;
  const instructionsLength = recipe.strInstructions?.length || 0;
  const title = recipe.strMeal.toLowerCase();
  
  // 1. Check for time in title (e.g., "15-minute", "30 min")
  const timeMatch = title.match(/(\d+)\s*-?\s*(min|minute)/);
  let estimatedTime;
  
  if (timeMatch) {
    estimatedTime = parseInt(timeMatch[1]);
  } else {
    // Heuristic: base 15 mins + 2 mins per ingredient + proportional to instructions
    estimatedTime = 15 + (ingredientsCount * 2) + Math.floor(instructionsLength / 100);
  }
  
  // 2. Estimate calories: varies by category
  const categoryBase: Record<string, number> = {
    'Beef': 600,
    'Pork': 550,
    'Lamb': 650,
    'Chicken': 450,
    'Seafood': 350,
    'Vegetarian': 300,
    'Vegan': 250,
    'Pasta': 500,
    'Dessert': 400,
  };
  
  const base = categoryBase[recipe.strCategory] || 400;
  
  // Adjust calories if "healthy", "light", or "low" is in title
  let calorieAdjustment = 1.0;
  if (title.includes('healthy') || title.includes('light') || title.includes('low')) {
    calorieAdjustment = 0.7;
  }
  
  const estimatedCalories = (base + (ingredientsCount * 15) + (recipe.idMeal.charCodeAt(0) % 50)) * calorieAdjustment;

  return {
    time: Math.min(Math.max(estimatedTime, 5), 180), // 5-180 mins
    calories: Math.floor(estimatedCalories)
  };
};

export const optimizeImage = (url: string, width: number = 400, quality: number = 80) => {
  if (!url) return '';
  // Use wsrv.nl as a free, fast image proxy and CDN
  // It resizes, compresses, and converts to WebP/Avif automatically
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp`;
};

