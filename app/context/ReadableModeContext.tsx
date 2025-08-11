'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ReadableModeContextType = {
  readableMode: boolean;
  toggleReadableMode: () => void;
};

const ReadableModeContext = createContext<ReadableModeContextType | null>(null);

export function ReadableModeProvider({ children }: { children: ReactNode }) {
  const [readableMode, setReadableMode] = useState(false);
  
  // Load preference from localStorage on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readableMode');
      if (saved) {
        setReadableMode(saved === 'true');
      }
    }
  }, []);
  
  // Apply class to document root and save preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      if (readableMode) {
        root.classList.add('readable-mode');
      } else {
        root.classList.remove('readable-mode');
      }
      
      // Save preference to localStorage
      localStorage.setItem('readableMode', String(readableMode));
    }
  }, [readableMode]);
  
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