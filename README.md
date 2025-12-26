# AI Recipe Generator & Meal Planner

A visually stunning, modern, and appetizing React application built with Vite, Tailwind CSS, Framer Motion, and Google Gemini AI.

## Features

- 🍳 **Discover Recipes**: Browse thousands of recipes from TheMealDB.
- 🪄 **AI Variations**: Use Google Gemini to generate healthy, vegan, or keto variations of any recipe.
- ❤️ **Favorites**: Save your favorite recipes to local storage.
- 🛒 **Shopping List**: Generate a checklist from recipe ingredients.
- 🌓 **Dark Mode**: Beautifully optimized for both light and dark themes.
- 📱 **Responsive**: Mobile-first design that looks great on all screens.
- ✨ **Animations**: Smooth transitions and stagger effects using Framer Motion.

## Tech Stack

- **React 18+** (TypeScript)
- **Vite**
- **Tailwind CSS v3.4**
- **Framer Motion**
- **Heroicons**
- **Google Generative AI SDK** (Gemini 1.5 Flash)
- **TheMealDB API**

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API Key (get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ai-recipe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Gemini API Key:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The project is ready to be deployed on Vercel or Netlify. Simply connect your repository and add the `VITE_GEMINI_API_KEY` environment variable in the dashboard.
"# ai-recipe-generator" 
