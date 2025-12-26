import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import { AIPromptResponse } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateRecipeVariation = async (
  originalRecipe: string,
  ingredients: string,
  request: string
): Promise<AIPromptResponse | string> => {
  if (!API_KEY) {
    return "API Key missing. Please add VITE_GEMINI_API_KEY to your .env file.";
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          ingredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          instructions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          tips: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ["title", "ingredients", "instructions", "tips"]
      }
    }
  });

  const prompt = `
    Original Recipe: ${originalRecipe}
    Ingredients: ${ingredients}
    User Request: ${request}
    
    Update this recipe. You MUST return the data in the specified JSON format.
    The instructions MUST be an array of strings, where each string is ONE step.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as AIPromptResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Error: ${error.message || "Failed to generate AI variation."}`;
  }
};
