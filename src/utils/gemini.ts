import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIPromptResponse } from '../types';

// Use the provided GEMINI_API_KEY from process.env (mapped in vite.config.ts)
const API_KEY = process.env.GEMINI_API_KEY;

const stringifyError = (err: any): string => {
  if (!err) return 'Unknown error';
  if (typeof err.message === 'string') return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

export const generateRecipeVariation = async (
  originalRecipe: string,
  ingredients: string,
  request: string
): Promise<AIPromptResponse | string> => {
  if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === '') {
    return "Error: GEMINI_API_KEY is missing. Please add it to your .env file.";
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      systemInstruction: "You are an expert master chef and nutritionist. Provide accurate, safe, and delicious recipe variations. No hallucinations. Base responses on the provided original recipe.",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
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
      CONTEXT:
      Original Recipe: ${originalRecipe}
      Standard Ingredients: ${ingredients}
      User Customization Request: ${request}
      
      TASK:
      1. Modify the original recipe to satisfy the User Customization Request.
      2. Ensure all replacement ingredients are standard and culinary-accurate.
      3. Maintain the core essence of the dish.
      4. Provide 3 specific 'Chef Tips' for success.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text) as AIPromptResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // If quota is exceeded, fallback to gemini-2.5-flash
    const isQuotaError =
      error?.statusCode === 429 ||
      error?.status === 429 ||
      (typeof error?.message === 'string' && /429|quota|QuotaFailure|generate_content_free_tier_requests/i.test(error.message));

    if (isQuotaError) {
      try {
        const fallbackGenAI = new GoogleGenerativeAI(API_KEY);
        const fallbackModel = fallbackGenAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: "You are an expert master chef and nutritionist. Provide accurate, safe, and delicious recipe variations. No hallucinations. Base responses on the provided original recipe.",
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            responseMimeType: "application/json",
          }
        });

        const fallbackResult = await fallbackModel.generateContent(prompt);
        const fallbackText = (await fallbackResult.response).text();
        return JSON.parse(fallbackText) as AIPromptResponse;
      } catch (fallbackError: any) {
        console.error("Gemini fallback failed:", fallbackError);
        return `Error: ${stringifyError(fallbackError)}`;
      }
    }

    return `Error: ${stringifyError(error)}`;
  }
};


export const analyzeRecipeStats = async (
  title: string,
  ingredients: string,
  instructions: string
): Promise<{ time: number; calories: number } | null> => {
  if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === '') return null;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are a professional chef and nutritionist. Analyze the provided recipe and provide the most accurate estimated cooking time (in minutes) and total calories (kcal) per serving.",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            time: { type: SchemaType.NUMBER },
            calories: { type: SchemaType.NUMBER }
          },
          required: ["time", "calories"]
        }
      }
    });

    const prompt = `Recipe: ${title}\nIngredients: ${ingredients}\nInstructions: ${instructions}\n\nProvide the cooking time and calories.`;
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Stats analysis failed:", error);
    return null;
  }
};

export const generateRecipesByIngredients = async (ingredients: string): Promise<AIPromptResponse[] | string> => {
  if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === '') {
    return "Error: GEMINI_API_KEY is missing. Please add it to your .env file.";
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: "You are a recipe generator for a modern, clean, and visually appealing website. The website theme uses simple, readable fonts, soft colors, and a minimal card-based layout for recipes.",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
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
              time: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.STRING },
              tips: { 
                type: SchemaType.ARRAY, 
                items: { type: SchemaType.STRING } 
              }
            },
            required: ["title", "ingredients", "instructions", "time", "difficulty"]
          }
        }
      }
    });

    const prompt = `
      When a user provides a list of ingredients, generate a set of 3-5 recipes that can be made with those ingredients. 
      USER INGREDIENTS: ${ingredients}

      For each recipe, provide:
      1. Recipe name (short and catchy)
      2. Ingredients list (highlight which ingredients the user already has)
      3. Step-by-step cooking instructions (clear and concise)
      4. Estimated cooking time and difficulty level
      5. Keep the style consistent with a clean, modern UI — short paragraphs, no long blocks of text, and easy-to-read formatting.
      
      Do not add extra commentary or unrelated text.
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    return JSON.parse(text) as AIPromptResponse[];
  } catch (error: any) {
    console.error("Generator Error:", error);
    return `Error: ${errorToString(error)}`;
  }
};
