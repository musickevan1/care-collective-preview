/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load test environment variables from .env.test
  const env = loadEnv(mode || 'test', process.cwd(), '');
  
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      // Load environment variables from .env.test
      env: {
        ...env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-12345678901234567890123456789012345678901234567890',
        NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/.next/**',
        '**/coverage/**',
        '**/dist/**',
        'scripts/',
        'supabase/',
        'public/',
        '**/middleware.ts',
        '**/layout.tsx',
        '**/not-found.tsx',
        '**/error.tsx',
        '**/loading.tsx',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
      },
      // Mock canvas for components that might use it
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './'),
        '@/components': resolve(__dirname, './components'),
        '@/app': resolve(__dirname, './app'),
        '@/lib': resolve(__dirname, './lib'),
      },
    },
  };
});