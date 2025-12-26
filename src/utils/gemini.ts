import { AIPromptResponse } from '../types';

export const generateRecipeVariation = async (
  originalRecipe: string,
  ingredients: string,
  request: string
): Promise<AIPromptResponse | string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalRecipe,
        ingredients,
        request,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AIPromptResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Error: ${error.message || "Failed to generate AI variation."}`;
  }
};
