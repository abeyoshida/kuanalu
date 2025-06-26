"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HeaderContextType {
  title: string;
  setTitle: (title: string) => void;
  entityName: string | null;
  setEntityName: (name: string | null) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  title: "Dashboard",
  setTitle: () => {},
  entityName: null,
  setEntityName: () => {},
});

export const useHeader = () => useContext(HeaderContext);

interface HeaderProviderProps {
  children: ReactNode;
  initialTitle?: string;
}

export function HeaderProvider({
  children,
  initialTitle = "Dashboard",
}: HeaderProviderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [entityName, setEntityName] = useState<string | null>(null);

  return (
    <HeaderContext.Provider
      value={{
        title,
        setTitle,
        entityName,
        setEntityName,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
} 