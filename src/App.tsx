import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  HeartIcon, 
  ShoppingBagIcon,
  ClipboardIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Recipe, Ingredient, UserProfile } from './types';
import { fetchRecipesByName, fetchRandomRecipe, fetchCategories, fetchRecipesByCategory, fetchRecipeById } from './utils/api';
import { ThemeToggle } from './components/ThemeToggle';
import { RecipeCard } from './components/RecipeCard';
import { SkeletonCard } from './components/SkeletonCard';
import { RecipeModal } from './components/RecipeModal';
import { RecipeGenerator } from './components/RecipeGenerator';
import { useLocalStorage } from './hooks/useLocalStorage';


function App() {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useLocalStorage<Recipe[]>('favorites', []);
  const [shoppingList, setShoppingList] = useLocalStorage<Ingredient[]>('shopping-list', []);
  const [user, setUser] = useLocalStorage<UserProfile>('user-profile', {
    name: 'Rehan',
    email: 'sajidnadeem2020@gmail.com'
  });
  const [view, setView] = useState<'discover' | 'favorites' | 'shopping' | 'profile' | 'generator'>('discover');
  const [visibleRecipesCount, setVisibleRecipesCount] = useState(12);


  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // 1. Try to load categories from cache first
      const cachedCats = localStorage.getItem('categories-cache');
      if (cachedCats) {
        setCategories(JSON.parse(cachedCats));
      }

      try {
        // 2. Fetch categories and initial recipes in parallel
        // We fetch 'Chicken' category initially as it's much faster than searching ''
        const [cats, initialRecipes] = await Promise.all([
          fetchCategories(),
          fetchRecipesByCategory('Chicken') 
        ]);

        setCategories(cats);
        localStorage.setItem('categories-cache', JSON.stringify(cats));
        setRecipes(initialRecipes);
        setVisibleRecipesCount(12);
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setView('discover');
    const results = await fetchRecipesByName(search);
    setRecipes(results);
    setSelectedCategory('All');
    setVisibleRecipesCount(12);
    setLoading(false);
  };

  const handleRandom = async () => {
    setLoading(true);
    const meal = await fetchRandomRecipe();
    if (meal) {
      setRecipes([meal]);
      setSelectedRecipe(meal);
    }
    setLoading(false);
  };

  const handleCategoryClick = async (cat: string) => {
    if (cat === selectedCategory) return;
    setLoading(true);
    setSelectedCategory(cat);
    setView('discover');

    try {
      const results = cat === 'All'
        ? await fetchRecipesByName('')
        : await fetchRecipesByCategory(cat);
      setRecipes(results);
      setVisibleRecipesCount(12);
    } catch (error) {
      console.error("Category fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleRecipeClick = async (recipe: Recipe) => {
    if (recipe.strInstructions) {
      setSelectedRecipe(recipe);
      return;
    }

    setLoading(true);
    try {
      const fullRecipe = await fetchRecipeById(recipe.idMeal);
      if (fullRecipe) {
        setSelectedRecipe(fullRecipe);
      }
    } catch (error) {
      console.error("Failed to fetch recipe details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    setFavorites(prev => {
      const isFav = prev.find(r => r.idMeal === recipe.idMeal);
      if (isFav) return prev.filter(r => r.idMeal !== recipe.idMeal);
      return [...prev, recipe];
    });
  };

  const addToShoppingList = (ingredients: Ingredient[]) => {
    setShoppingList(prev => {
      const newList = [...prev];
      ingredients.forEach(newItem => {
        if (!newList.find(item => item.name === newItem.name)) {
          newList.push(newItem);
        }
      });
      return newList;
    });
    // Optional: show toast
  };

  const filteredRecipes = useMemo(() => {
    if (view === 'favorites') return favorites;
    return recipes;
  }, [view, recipes, favorites]);

  const visibleRecipes = useMemo(() => {
    return filteredRecipes.slice(0, visibleRecipesCount);
  }, [filteredRecipes, visibleRecipesCount]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('discover')}>
            <div className="w-10 h-10 bg-primary-light rounded-2xl flex items-center justify-center shadow-lg rotate-12">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black font-poppins tracking-tight hidden sm:block">
              AI <span className="text-primary-light">Recipe</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
                        {[
          { id: 'discover', label: 'Discover', icon: MagnifyingGlassIcon },
          { id: 'generator', label: 'AI Magic', icon: SparklesIcon },
          { id: 'favorites', label: 'Favorites', icon: HeartIcon },

                          { id: 'shopping', label: 'Shopping', icon: ShoppingBagIcon },
                          { id: 'profile', label: 'Profile', icon: UserCircleIcon },
                        ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`flex items-center gap-2 transition-colors ${ view === item.id ? 'text-primary-light' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'discover' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-7xl font-black font-poppins mb-6 leading-tight">
                Cook Like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-orange-400">Master Chef</span> <br /> 
                with AI assistance.
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                Discover thousands of recipes, generate healthy variations, and plan your meals instantly.
              </p>

              <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group mb-8">
                <input
                  type="text"
                  placeholder="Search by ingredient, cuisine, or recipe name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-8 py-6 rounded-[2rem] bg-surface-light dark:bg-surface-dark border-2 border-transparent focus:border-primary-light outline-none shadow-2xl text-lg transition-all pr-40"
                />
                <div className="absolute right-3 top-3 bottom-3 flex gap-2">
                  <button type="button" onClick={handleRandom} className="btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200">
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                  <button type="submit" className="btn btn-primary px-8">
                    Search
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleCategoryClick('All')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${ selectedCategory === 'All' 
                      ? 'bg-primary-light text-white' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-light'
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 10).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${ selectedCategory === cat 
                        ? 'bg-primary-light text-white' 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-light'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'generator' && (
            <motion.div
              key="generator-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <RecipeGenerator />
            </motion.div>
          )}


          {view === 'favorites' && (
            <motion.div
              key="favorites-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <h2 className="text-4xl font-black font-poppins">Your Favorites</h2>
              <p className="text-slate-500 mt-2">Recipes you've loved and saved.</p>
            </motion.div>
          )}

          {view === 'shopping' && (
            <motion.div
              key="shopping-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black font-poppins">Shopping List</h2>
                  <p className="text-slate-500 mt-2">{shoppingList.length} items to buy</p>
                </div>
                <button 
                  onClick={() => setShoppingList([])}
                  className="text-red-500 font-semibold hover:underline"
                >
                  Clear List
                </button>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Your shopping list is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shoppingList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <label className="flex items-center gap-4 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={item.checked}
                            onChange={() => {
                              const newList = [...shoppingList];
                              newList[idx].checked = !newList[idx].checked;
                              setShoppingList(newList);
                            }}
                            className="w-6 h-6 rounded-lg border-slate-300 text-secondary-light focus:ring-secondary-light"
                          />
                          <span className={`text-lg ${item.checked ? 'line-through text-slate-400' : ''}`}>
                            <span className="font-bold">{item.measure}</span> {item.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {shoppingList.length > 0 && (
                  <button 
                    onClick={() => {
                      const text = shoppingList.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.measure} ${i.name}`).join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    className="w-full mt-8 btn btn-secondary"
                  >
                    <ClipboardIcon className="w-5 h-5" /> Copy to Clipboard
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-tr from-primary-light to-orange-400 rounded-full mx-auto flex items-center justify-center shadow-2xl mb-4">
                  <span className="text-4xl text-white font-black">{user.name.charAt(0)}</span>
                </div>
                <h2 className="text-3xl font-black font-poppins">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold font-poppins mb-8 flex items-center gap-3">
                  <UserCircleIcon className="w-6 h-6 text-primary-light" />
                  Account Settings
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={user.name}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-light outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-light outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-center">
                    <p className="text-2xl font-black text-primary-light">{favorites.length}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">Favorites</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 text-center">
                    <p className="text-2xl font-black text-secondary-light">{shoppingList.length}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">Cart Items</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {view !== 'shopping' && view !== 'profile' && view !== 'generator' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              ) : visibleRecipes.length > 0 ? (
                visibleRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.idMeal}
                    recipe={recipe}
                    onClick={() => handleRecipeClick(recipe)}
                    isFavorite={!!favorites.find(r => r.idMeal === recipe.idMeal)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="text-6xl mb-4">🍳</div>
                  <h3 className="text-2xl font-bold font-poppins">No recipes found</h3>
                  <p className="text-slate-500 mt-2">Try searching for something else!</p>
                </div>
              )}
            </div>

            {!loading && filteredRecipes.length > visibleRecipesCount && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleRecipesCount(prev => prev + 12)}
                  className="btn btn-primary px-8 py-4 text-lg"
                >
                  Load More Recipes
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary-light rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black font-poppins tracking-tight">
            AI <span className="text-primary-light">Recipe</span>
          </h1>
        </div>
        <p className="text-slate-500 text-sm">© 2025 AI Recipe Generator & Meal Planner. Developed by Rehan. Powered by TheMealDB.</p>
      </footer>

      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onAddIngredientsToShoppingList={addToShoppingList}
      />
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 glass-card rounded-full shadow-2xl border border-white/20 flex items-center gap-8">
                {[
                  { id: 'discover', icon: MagnifyingGlassIcon },
                  { id: 'favorites', icon: HeartIcon },
                  { id: 'shopping', icon: ShoppingBagIcon },
                  { id: 'profile', icon: UserCircleIcon },
                ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`p-2 rounded-full transition-all ${ view === item.id ? 'bg-primary-light text-white scale-110 shadow-lg' : 'text-slate-500'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
