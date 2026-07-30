import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { ImageSection } from "@ImageViewer/sections/ImageViewerDrawer/ImageSection";
import { AnnotationSection } from "@ImageViewer/sections/ImageViewerDrawer/AnnotationSection/AnnotationSection";

export type DrawerContextType = "images" | "annotations";
export const DrawerActionContext = createContext<{
  drawerViewComponent: JSX.Element;
  setDrawerContext: React.Dispatch<React.SetStateAction<DrawerContextType>>;
}>({
  drawerViewComponent: <></>,
  setDrawerContext: (_value: React.SetStateAction<DrawerContextType>) => {},
});

export const DrawerActionProvider = ({ children }: { children: ReactNode }) => {
  const [drawerContext, setDrawerContext] =
    useState<DrawerContextType>("images");

  const drawerViewComponent = useMemo(() => {
    switch (drawerContext) {
      case "images":
        return <ImageSection />;
      case "annotations":
        return <AnnotationSection />;
    }
  }, [drawerContext]);

  return (
    <DrawerActionContext.Provider
      value={{ drawerViewComponent, setDrawerContext }}
    >
      {children}
    </DrawerActionContext.Provider>
  );
};

export const useSetDrawerView = () => {
  const drawerContext = useContext(DrawerActionContext);

  return drawerContext.setDrawerContext;
};

export const useDrawerViewComponent = () => {
  const drawerContext = useContext(DrawerActionContext);

  return drawerContext.drawerViewComponent;
};
