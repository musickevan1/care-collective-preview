import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReadableModeProvider } from '@/app/context/ReadableModeContext';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReadableModeProvider>
      {children}
    </ReadableModeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };