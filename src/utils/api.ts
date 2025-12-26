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
  return instructions
    .split(/\r?\n|\.\s+/)
    .map(step => step.trim())
    .filter(step => step.length > 5);
};
