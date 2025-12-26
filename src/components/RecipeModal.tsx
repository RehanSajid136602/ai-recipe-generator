import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, FireIcon, ShoppingCartIcon, ClipboardIcon, SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Recipe, Ingredient, AIPromptResponse } from '../types';
import { getIngredients, formatInstructions } from '../utils/api';
import { useState, useRef } from 'react';
import { generateRecipeVariation } from '../utils/gemini';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onAddIngredientsToShoppingList: (ingredients: Ingredient[]) => void;
}

export const RecipeModal = ({ recipe, onClose, onAddIngredientsToShoppingList }: RecipeModalProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIPromptResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [includeAIInPDF, setIncludeAIInPDF] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  if (!recipe) return null;

  const ingredients = getIngredients(recipe);

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAIAction = async (request: string) => {
    setAiLoading(true);
    setAiResponse(null);
    setAiError(null);
    const ingredientsList = ingredients.map(i => `${i.measure} ${i.name}`).join(', ');
    const result = await generateRecipeVariation(recipe.strMeal, ingredientsList, request);
    
    if (typeof result === 'string') {
      setAiError(result);
    } else {
      setAiResponse(result);
    }
    setAiLoading(false);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      // Create a hidden container for the PDF layout
      const printContainer = document.createElement('div');
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '800px'; // Standard width for PDF
      printContainer.style.backgroundColor = 'white';
      printContainer.style.color = 'black';
      printContainer.style.padding = '40px';
      printContainer.className = 'pdf-export-container';
      document.body.appendChild(printContainer);

      // Construct the HTML for the PDF
      const instructionsHTML = formatInstructions(recipe.strInstructions)
        .map((step, idx) => `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; page-break-inside: avoid;">
            <tr>
              <td style="width: 36px; vertical-align: top; padding-top: 4px;">
                <div style="width: 32px; height: 32px; background-color: #f97316; border-radius: 10px; display: table; margin: 0 auto;">
                  <span style="display: table-cell; vertical-align: middle; text-align: center; color: white; font-family: Helvetica, Arial, sans-serif; font-weight: 800; font-size: 15px;">
                    ${idx + 1}
                  </span>
                </div>
              </td>
              <td style="padding-left: 18px; vertical-align: top;">
                <div style="font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.65; color: #1e293b; text-align: justify;">
                  ${step}
                </div>
              </td>
            </tr>
          </table>
        `).join('');

      const ingredientsHTML = ingredients
        .map(ing => `
          <div style="margin-bottom: 12px; font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #475569; display: flex; align-items: baseline;">
            <span style="color: #f97316; margin-right: 10px; font-size: 18px;">•</span>
            <span><b style="color: #0f172a; font-weight: 700;">${ing.measure}</b> ${ing.name}</span>
          </div>
        `).join('');

      let aiHTML = '';
      if (includeAIInPDF && aiResponse) {
        aiHTML = `
          <div style="margin-top: 45px; padding: 35px; background-color: #fffaf0; border: 2px solid #ffedd5; border-radius: 30px; page-break-inside: avoid;">
            <div style="display: flex; align-items: center; margin-bottom: 25px;">
              <div style="width: 12px; height: 30px; background-color: #f97316; border-radius: 4px; margin-right: 15px;"></div>
              <h2 style="color: #9a3412; font-family: Helvetica, Arial, sans-serif; margin: 0; font-size: 28px; font-weight: 800;">${aiResponse.title}</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #c2410c; font-family: Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Updated Ingredients</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${aiResponse.ingredients.map(i => `<div style="font-size: 14px; color: #475569; font-family: Helvetica, Arial, sans-serif;">- ${i}</div>`).join('')}
              </div>
            </div>

            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 18px; color: #c2410c; font-family: Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Chef's Variation Steps</h3>
            ${aiResponse.instructions.map((s, i) => `
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr>
                  <td style="width: 30px; vertical-align: top;">
                    <div style="width: 26px; height: 26px; background-color: #fb923c; border-radius: 6px; display: table;">
                      <span style="display: table-cell; vertical-align: middle; text-align: center; color: white; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 13px;">
                        ${i + 1}
                      </span>
                    </div>
                  </td>
                  <td style="padding-left: 14px; vertical-align: top;">
                    <div style="font-size: 15px; line-height: 1.6; color: #475569; font-family: Helvetica, Arial, sans-serif;">
                      ${s}
                    </div>
                  </td>
                </tr>
              </table>
            `).join('')}
          </div>
        `;
      }

      printContainer.innerHTML = `
        <div style="background-color: white; color: #0f172a; padding: 10px;">
          <div style="width: 100%; height: 420px; margin-bottom: 40px; border-radius: 32px; overflow: hidden; background: url('${recipe.strMealThumb}') center/cover no-repeat; box-shadow: 0 20px 50px rgba(0,0,0,0.15);">
          </div>

          <div style="padding: 0 10px;">
            <h1 style="font-family: Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 900; margin: 0 0 15px 0; color: #0f172a; line-height: 1.1; letter-spacing: -1px;">${recipe.strMeal}</h1>
            
            <div style="display: flex; gap: 12px; margin-bottom: 50px;">
              <span style="font-family: Helvetica, Arial, sans-serif; background-color: #f97316; color: white; padding: 6px 18px; border-radius: 100px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${recipe.strCategory}</span>
              <span style="font-family: Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #64748b; padding: 6px 18px; border-radius: 100px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${recipe.strArea}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
              <tr>
                <td style="width: 32%; vertical-align: top; padding-right: 45px; border-right: 1px solid #f1f5f9;">
                  <h2 style="font-family: Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 30px; color: #0f172a; display: flex; align-items: center;">
                    Ingredients
                  </h2>
                  ${ingredientsHTML}
                </td>
                <td style="width: 68%; vertical-align: top; padding-left: 45px;">
                  <h2 style="font-family: Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 30px; color: #0f172a;">
                    Cooking Instructions
                  </h2>
                  ${instructionsHTML}
                </td>
              </tr>
            </table>

            ${aiHTML}
            
            <div style="margin-top: 80px; padding: 30px 0; border-top: 2px solid #f1f5f9; text-align: center;">
              <p style="font-family: Helvetica, Arial, sans-serif; color: #94a3b8; font-size: 14px; font-weight: 600; margin: 0;">
                Created with <span style="color: #f97316;">AI Recipe Generator</span>
              </p>
            </div>
          </div>
        </div>
      `;

      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${recipe.strMeal.replace(/\s+/g, '_')}_Recipe.pdf`);
      
      document.body.removeChild(printContainer);
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          className="bg-surface-light dark:bg-surface-dark w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Actions */}
          <div className="absolute top-6 right-6 z-10 flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-bold">
              <input 
                type="checkbox" 
                id="includeAI" 
                checked={includeAIInPDF} 
                onChange={() => setIncludeAIInPDF(!includeAIInPDF)}
                className="w-4 h-4 rounded border-slate-300 text-primary-light focus:ring-primary-light"
              />
              <label htmlFor="includeAI" className="cursor-pointer">Include AI</label>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="p-2 rounded-full glass-card hover:bg-primary-light hover:text-white transition-all disabled:opacity-50"
              title="Download as PDF"
            >
              <ArrowDownTrayIcon className={`w-6 h-6 ${isDownloading ? 'animate-bounce' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full glass-card hover:bg-red-500 hover:text-white transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col md:row h-full max-h-[90vh] md:flex-row" ref={modalContentRef}>
            <div className="md:w-1/2 h-80 md:h-auto relative">
              <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <span className="px-4 py-1 rounded-full bg-secondary-light/90 text-sm font-bold uppercase mb-3 inline-block">
                  {recipe.strCategory}
                </span>
                <h2 className="text-4xl font-bold font-poppins mb-2">{recipe.strMeal}</h2>
                <div className="flex items-center gap-6 mt-2 text-slate-200">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">45 mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FireIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">520 kcal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 overflow-y-auto p-10 custom-scrollbar bg-surface-light dark:bg-surface-dark">
              <section className="mb-10">
                {/* 
                  Safe Zone Implementation: 
                  Increased pr to 64 (256px) to accommodate the full width of the 
                  floating action bar (AI Toggle + Download + Close buttons).
                */}
                <div className="flex items-center justify-between mb-6 md:pr-64">
                  <h3 className="text-2xl font-bold font-poppins flex items-center gap-3">
                    Ingredients
                  </h3>
                  <button 
                    onClick={() => onAddIngredientsToShoppingList(ingredients.map(i => ({ ...i, checked: false })))}
                    className="text-primary-light text-sm font-bold flex items-center gap-2 hover:underline shrink-0"
                  >
                    <ShoppingCartIcon className="w-5 h-5" /> Add all
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[ing.name];
                    return (
                      <label 
                        key={idx} 
                        className={`flex items-center gap-4 p-3 rounded-2xl transition-all border border-transparent ${
                          isChecked 
                            ? 'opacity-60 bg-slate-100 dark:bg-slate-800/30 cursor-default' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          disabled={isChecked}
                          onChange={() => toggleIngredient(ing.name)}
                          className="w-6 h-6 rounded border-slate-300 text-primary-light focus:ring-primary-light disabled:opacity-50" 
                        />
                        <span className={`text-lg ${isChecked ? 'line-through text-slate-400' : ''}`}>
                          <span className="font-bold text-slate-900 dark:text-white">{ing.measure}</span> <span className="text-slate-600 dark:text-slate-300">{ing.name}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="mb-10">
                <h3 className="text-2xl font-bold font-poppins mb-6">Instructions</h3>
                <div className="space-y-6">
                  {formatInstructions(recipe.strInstructions).map((step, idx) => (
                    <div key={idx} className="flex gap-5">
                      <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary-light/10 text-primary-light flex items-center justify-center font-bold text-lg">
                        {idx + 1}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1 text-lg">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Only show AI Section if it's there AND (we're not downloading OR includeAI is true) */}
              <div className={!includeAIInPDF && isDownloading ? 'hidden' : 'block'}>
                <section className="p-8 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-inner">
                  <h3 className="text-2xl font-bold font-poppins mb-6 flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-primary-light" />
                    AI Kitchen Assistant
                  </h3>
                  
                  {/* Hide buttons during download */}
                  <div className={`grid grid-cols-2 gap-4 mb-8 ${isDownloading ? 'hidden' : 'grid'}`}>
                    {[
                      { label: 'Make it Vegan', req: 'Make this recipe vegan with alternative ingredients.' },
                      { label: 'Keto Version', req: 'Create a low-carb, keto-friendly version.' },
                      { label: 'Add Spice', req: 'How can I make this spicier and more vibrant?' },
                      { label: 'Chef Tips', req: 'Give me 3 expert chef secrets for this recipe.' }
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAIAction(btn.req)}
                        className="px-5 py-3 text-sm font-bold rounded-2xl border-2 border-primary-light/20 text-primary-light hover:bg-primary-light hover:text-white hover:border-primary-light transition-all active:scale-95"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {aiLoading && (
                    <div className="flex flex-col items-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <SparklesIcon className="w-12 h-12 text-primary-light" />
                      </motion.div>
                      <p className="mt-4 text-slate-500 font-medium italic">Chef Gemini is perfecting your variation...</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-4 p-5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium border border-red-100 dark:border-red-900/30">
                      {aiError}
                    </div>
                  )}

                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-8"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-3xl font-bold font-poppins text-primary-light leading-tight">
                          {aiResponse.title}
                        </h4>
                        <button 
                          onClick={() => {
                            const text = `${aiResponse.title}\n\nIngredients:\n${aiResponse.ingredients.join('\n')}\n\nInstructions:\n${aiResponse.instructions.map((s, i) => `${i+1}. ${s}`).join('\n')}`;
                            navigator.clipboard.writeText(text);
                          }}
                          className={`p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors ${isDownloading ? 'hidden' : 'block'}`}
                          title="Copy to clipboard"
                        >
                          <ClipboardIcon className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-bold text-xl flex items-center gap-2">
                          <span className="w-2 h-6 bg-primary-light rounded-full" />
                          Updated Ingredients
                        </h5>
                        <ul className="grid grid-cols-1 gap-3">
                          {aiResponse.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-lg">
                              <span className="w-2 h-2 rounded-full bg-primary-light/50" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-bold text-xl flex items-center gap-2">
                          <span className="w-2 h-6 bg-primary-light rounded-full" />
                          Steps to Follow
                        </h5>
                        <div className="space-y-6">
                          {aiResponse.instructions.map((step, idx) => (
                            <div key={idx} className="flex gap-5">
                              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary-light/10 text-primary-light flex items-center justify-center font-bold text-lg">
                                {idx + 1}
                              </span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1 text-lg">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {aiResponse.tips && aiResponse.tips.length > 0 && (
                        <div className="p-8 rounded-[2rem] bg-secondary-light/5 border-2 border-secondary-light/10">
                          <h5 className="font-bold text-xl text-secondary-light mb-4 flex items-center gap-2">
                            <span>💡</span> Chef's Expert Tips
                          </h5>
                          <ul className="space-y-3">
                            {aiResponse.tips.map((tip, idx) => (
                              <li key={idx} className="text-slate-600 dark:text-slate-300 flex gap-3 text-lg leading-relaxed">
                                <span className="text-secondary-light">•</span> {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
