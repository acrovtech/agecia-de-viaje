'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type TitleContextType = {
  title: string | null;
  setTitle: (t: string | null) => void;
};

const TitleContext = createContext<TitleContextType>({ title: null, setTitle: () => {} });

export function TitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  
  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(TitleContext);
}

export function SetPageTitle({ title }: { title: string }) {
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  
  return null;
}
