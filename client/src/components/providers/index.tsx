'use client';

import { ReactNode } from 'react';
import { NeonAuthProvider } from './NeonAuthProvider';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NeonAuthProvider>
      {children}
      <Toaster position="top-right" />
    </NeonAuthProvider>
  );
}
