import { createContext, useContext, useState } from "react";

import type { ReactNode } from "react";

type DrawerContextType = "images" | "annotations";
const DrawerActionContext = createContext<{
  drawerContext: DrawerContextType;
  setDrawerContext: React.Dispatch<React.SetStateAction<DrawerContextType>>;
}>({
  drawerContext: "annotations",
  setDrawerContext: (_value: React.SetStateAction<DrawerContextType>) => {},
});

export const DrawerActionProvider = ({ children }: { children: ReactNode }) => {
  const [drawerContext, setDrawerContext] =
    useState<DrawerContextType>("annotations");

  return (
    <DrawerActionContext.Provider value={{ drawerContext, setDrawerContext }}>
      {children}
    </DrawerActionContext.Provider>
  );
};

export const useDrawerContext = () => {
  const drawerContext = useContext(DrawerActionContext);

  return drawerContext;
};
