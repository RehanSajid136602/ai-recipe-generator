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
      model: "gemini-3-flash-preview",
      systemInstruction: "You are an expert master chef and nutritionist. Your goal is to provide accurate, safe, and delicious recipe variations. You must NOT hallucinate ingredients that don't exist or provide dangerous cooking advice. Always base your response on the provided original recipe while accurately fulfilling the user's specific request (e.g., making it vegan, keto, etc.). If a request is impossible or unsafe, explain why briefly in the tips section.",
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
      2. Ensure all replacement ingredients are standard, culinary-accurate, and appropriate for the requested diet (e.g., if vegan, no honey or eggs).
      3. Maintain the core essence of the dish while making the requested changes.
      4. Provide 3 specific 'Chef Tips' for success with this specific variation.
      
      OUTPUT REQUIREMENTS:
      - JSON format only.
      - 'instructions' must be a logical, step-by-step array.
      - NO hallucinations. Only include ingredients that are necessary and realistic.
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