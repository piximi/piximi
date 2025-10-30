import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ExportAnnotationsSection } from "../sections/ImageViewerDrawer/ExportAnnotationsSection";
import { MetadataList } from "../sections/ImageViewerDrawer/MetadataList";
import { KindCategorySection } from "../sections/ImageViewerDrawer/KindCategorySection";
import { AnnotationSection } from "../sections/ImageViewerDrawer/annotation-section/AnnotationSection";
import { TrackingControlsContainer } from "features/annotation-tracking/control-section/TrackingControlsContainer";

export type DrawerContextType =
  | "export"
  | "images"
  | "categories"
  | "annotations"
  | "tracking";
export const DrawerViewContext = createContext<{
  drawerViewComponent: JSX.Element;
  setDrawerContext: React.Dispatch<React.SetStateAction<DrawerContextType>>;
}>({
  drawerViewComponent: <></>,
  setDrawerContext: (_value: React.SetStateAction<DrawerContextType>) => {},
});

export const DrawerViewProvider = ({ children }: { children: ReactNode }) => {
  const [drawerContext, setDrawerContext] =
    useState<DrawerContextType>("images");

  const drawerViewComponent = useMemo(() => {
    switch (drawerContext) {
      case "export":
        return <ExportAnnotationsSection />;
      case "images":
        return <MetadataList />;
      case "categories":
        return <KindCategorySection />;
      case "annotations":
        return <AnnotationSection />;
      case "tracking":
        return <TrackingControlsContainer />;
    }
  }, [drawerContext]);

  return (
    <DrawerViewContext.Provider
      value={{ drawerViewComponent, setDrawerContext }}
    >
      {children}
    </DrawerViewContext.Provider>
  );
};

export const useSetDrawerView = () => {
  const drawerContext = useContext(DrawerViewContext);

  return drawerContext.setDrawerContext;
};

export const useDrawerViewComponent = () => {
  const drawerContext = useContext(DrawerViewContext);

  return drawerContext.drawerViewComponent;
};
