import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, FireIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { generateRecipesByIngredients } from '../utils/gemini';
import { AIPromptResponse } from '../types';

export const RecipeGenerator = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<AIPromptResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setRecipes([]);

    const result = await generateRecipesByIngredients(input);
    if (typeof result === 'string') {
      setError(result);
    } else {
      setRecipes(result);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black font-poppins mb-4">AI Magic Generator</h2>
        <p className="text-slate-500 text-lg">Enter the ingredients you have, and we'll create the perfect recipes for you.</p>
      </div>

      <div className="glass-card p-8 rounded-[2.5rem] mb-12 shadow-2xl border border-slate-200 dark:border-slate-800">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Chicken, Spinach, Heavy Cream, Garlic, Pasta..."
          className="w-full h-32 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-light outline-none transition-all text-lg mb-6 resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className="w-full btn btn-primary py-6 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <SparklesIcon className="w-6 h-6" />
              Generate Magic Recipes
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {recipes.map((recipe, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold font-poppins mb-4 text-primary-light">{recipe.title}</h3>
                
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <ClockIcon className="w-4 h-4" /> {recipe.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <FireIcon className="w-4 h-4" /> {recipe.difficulty}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-sm text-slate-400 uppercase mb-3 tracking-widest">Ingredients</h4>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <CheckCircleIcon className="w-5 h-5 text-secondary-light shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-400 uppercase mb-3 tracking-widest">Steps</h4>
                  <ol className="space-y-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-primary-light/10 text-primary-light flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
