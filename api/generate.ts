// @ts-nocheck
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API Key missing on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { originalRecipe, ingredients, request } = await req.json();

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate AI variation." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}