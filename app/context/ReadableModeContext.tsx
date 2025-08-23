'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ReadableModeContextType = {
  readableMode: boolean;
  toggleReadableMode: () => void;
};

const ReadableModeContext = createContext<ReadableModeContextType | null>(null);

export function ReadableModeProvider({ children }: { children: ReactNode }) {
  const [readableMode, setReadableMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Hydration detection and localStorage loading
  useEffect(() => {
    // Mark as hydrated to prevent SSR mismatch
    setIsHydrated(true);
    
    // Check if we're in the browser and load preference
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('readableMode');
        if (saved) {
          setReadableMode(saved === 'true');
        }
      } catch (error) {
        // localStorage might be disabled, fail silently
        console.warn('Could not access localStorage:', error);
      }
    }
  }, []);
  
  // Apply class to document root and save preference
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        typeof document !== 'undefined' && 
        typeof localStorage !== 'undefined' && 
        isHydrated) {
      
      try {
        const root = document.documentElement;
        
        if (readableMode) {
          root.classList.add('readable-mode');
        } else {
          root.classList.remove('readable-mode');
        }
        
        // Save preference to localStorage
        localStorage.setItem('readableMode', String(readableMode));
      } catch (error) {
        // DOM manipulation or localStorage might fail, fail silently
        console.warn('Could not update readable mode:', error);
      }
    }
  }, [readableMode, isHydrated]);
  
  const toggleReadableMode = () => {
    setReadableMode(prev => !prev);
  };
  
  return (
    <ReadableModeContext.Provider value={{ readableMode, toggleReadableMode }}>
      {children}
    </ReadableModeContext.Provider>
  );
}

export const useReadableMode = () => {
  const context = useContext(ReadableModeContext);
  if (!context) {
    throw new Error('useReadableMode must be used within a ReadableModeProvider');
  }
  return context;
};