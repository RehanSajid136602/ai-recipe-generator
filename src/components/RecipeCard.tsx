import { motion } from 'framer-motion';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Recipe } from '../types';
import { useState } from 'react';
import { optimizeImage } from '../utils/api';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const RecipeCard = ({ recipe, onClick, isFavorite, onToggleFavorite }: RecipeCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="relative group cursor-pointer overflow-hidden rounded-3xl bg-surface-light dark:bg-surface-dark shadow-xl hover:shadow-2xl transition-all duration-300"
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-light/20 border-t-primary-light rounded-full animate-spin" />
          </div>
        )}
        <motion.img
          loading="lazy"
          src={optimizeImage(recipe.strMealThumb, 400)}
          alt={recipe.strMeal}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      
      <div className="absolute inset-0 recipe-card-gradient opacity-80" />
      
      <button
        onClick={onToggleFavorite}
        className="absolute top-4 right-4 p-2 rounded-full glass-card hover:scale-110 transition-transform"
      >
        {isFavorite ? (
          <HeartIconSolid className="w-6 h-6 text-red-500" />
        ) : (
          <HeartIcon className="w-6 h-6 text-white group-hover:text-red-400 transition-colors" />
        )}
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <span className="px-3 py-1 rounded-full bg-primary-light/90 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
          {recipe.strCategory}
        </span>
        <h3 className="text-xl font-bold font-poppins leading-tight line-clamp-2">
          {recipe.strMeal}
        </h3>
        <p className="text-sm text-slate-300 mt-1">{recipe.strArea}</p>
      </div>
    </motion.div>
  );
};

