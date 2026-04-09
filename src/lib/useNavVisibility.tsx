"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface NavVisibilityContextValue {
  navVisible: boolean;
  setNavVisible: (visible: boolean) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextValue>({
  navVisible: true,
  setNavVisible: () => {},
});

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [navVisible, setNavVisible] = useState(true);
  return (
    <NavVisibilityContext.Provider value={{ navVisible, setNavVisible }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  return useContext(NavVisibilityContext);
}
