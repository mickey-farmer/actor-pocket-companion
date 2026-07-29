'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface NavDrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const NavContext = createContext<NavDrawerState | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <NavContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavDrawer(): NavDrawerState {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNavDrawer must be used within a NavProvider');
  }
  return ctx;
}
