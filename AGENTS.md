# AGENTS.md

This file provides essential information for agentic coding assistants working in this repository.

## Available Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint with TypeScript support

### Testing
No test framework is currently configured. If adding tests, ensure to update this section.

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`strict: true`)
- Unused locals and parameters are errors
- No implicit any types
- Target: ES2020 with React JSX
- Use interface for object shapes, type for unions/primitives

### React Patterns
- Use functional components with hooks exclusively
- Named exports preferred over default exports for components
- Example: `export const ComponentName = ({ prop }: Props) => { ... }`
- Import React explicitly only when using JSX: `import React from 'react'`

### Imports
- Group imports in this order:
  1. React and core libraries
  2. Third-party libraries
  3. Internal types
  4. Internal components
  5. Internal utils/hooks
- Use named imports: `import { useState } from 'react'`
- Avoid barrel files where possible; import directly from file

### Component Structure
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconName } from '@heroicons/react/24/outline';
import { MyType } from '../types';
import { myUtil } from '../utils/api';

interface ComponentProps {
  prop: string;
  onAction: () => void;
}

export const Component = ({ prop, onAction }: ComponentProps) => {
  const [state, setState] = useState<string>('');

  const handleClick = () => {
    // implementation
  };

  return (
    <motion.div className="...">
      {/* JSX */}
    </motion.div>
  );
};
```

### Naming Conventions
- Components: PascalCase (`RecipeCard.tsx`, `useLocalStorage.ts`)
- Variables/Functions: camelCase (`fetchRecipesByName`, `handleClick`)
- Constants: UPPER_SNAKE_CASE (`BASE_URL`)
- Interfaces: PascalCase (`Recipe`, `UserProfile`)
- Types: PascalCase (`Recipe`, `Ingredient`)
- CSS classes: kebab-case via Tailwind utilities

### Styling with Tailwind CSS
- Use utility classes for all styling
- Follow spacing/color consistency:
  - Primary: `primary-light` (#f97316)
  - Secondary: `secondary-light` (#22c55e)
  - Surface: `surface-light` / `surface-dark`
- Glass morphism: `glass-card` utility
- Rounded corners: `rounded-2xl`, `rounded-3xl`, `rounded-[2.5rem]`
- Typography: `font-poppins`, `font-black`, `font-bold`

### Error Handling
```tsx
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error("Operation failed:", error);
  throw error; // or return fallback value
}
```

### Async Operations
- Use async/await over Promise chains
- Always handle errors in try/catch
- Use Promise.all for parallel operations when appropriate
- AbortController not currently used but recommended for fetch cancellation

### State Management
- React hooks (useState, useEffect) for local component state
- Custom hooks for reusable logic (e.g., `useLocalStorage`)
- Local storage via custom hook, not directly

### API Integration
- TheMealDB for recipe data (no auth required)
- Google Gemini AI for recipe variations (requires GEMINI_API_KEY)
- API routes located in `/api` directory for server-side calls
- Client-side API utilities in `/src/utils/api.ts`

### Animation (Framer Motion)
- Use `motion` components for animations
- Common patterns:
  - Page transitions: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`
  - Hover effects: `whileHover={{ scale: 1.05 }}`
  - Layout animations: `layout` prop

### File Organization
```
src/
├── components/     # Reusable React components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions (API, helpers)
├── types/          # TypeScript interfaces/types
├── App.tsx         # Main application component
└── main.tsx        # Entry point
```

### Linting Rules
- ESLint with TypeScript plugin
- React hooks rules enforced
- React refresh for hot module replacement
- Max warnings: 0 (treat warnings as errors)
- Run `npm run lint` before committing changes

### Type Safety
- Always type function parameters
- Use generic types for reusable functions: `useLocalStorage<T>`
- Avoid `any` - use `unknown` with type guards if necessary
- Use proper typing for API responses

### Accessibility
- Use semantic HTML elements
- Include alt text for images
- Use button elements for actions, anchor tags for navigation
- ARIA labels when necessary (though minimal usage observed)

### Performance
- Lazy load images: `<img loading="lazy" ... />`
- Use `useMemo` for expensive computations
- `key` prop required in list iterations
- Code splitting via dynamic imports (if adding large dependencies)

### Notes
- The `api/` directory contains Vercel Edge Functions
- Environment variables: Add `GEMINI_API_KEY` to `.env` file
- Deploy on Vercel with server-side API routes for security
- The project uses Preact-compatible patterns with React
