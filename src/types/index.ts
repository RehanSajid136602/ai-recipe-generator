export interface Recipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: any; // For dynamic ingredients
}

export interface Ingredient {
  name: string;
  measure: string;
  checked?: boolean;
}

export interface AIPromptResponse {
  title: string;
  ingredients: string[];
  instructions: string[];
  tips?: string[];
}

export interface UserProfile {
  name: string;
  email: string;
}
