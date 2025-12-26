import { motion } from 'framer-motion';

export const SkeletonCard = () => {
  return (
    <div className="rounded-3xl overflow-hidden bg-surface-light dark:bg-surface-dark shadow-xl">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
};
