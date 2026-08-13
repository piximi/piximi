import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { batch, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

import { addListener, isAnyOf } from "@reduxjs/toolkit";

import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { productionStore } from "store";
import type { RootState } from "store/rootReducer";
import { dataSlice } from "store/data";
import type { DataStateV2 } from "store/data/types";

import type { UnsubscribeListener } from "@reduxjs/toolkit";

const DataContext = createContext<{
  savedData: DataStateV2 | undefined;
}>({ savedData: undefined });

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();
  const [savedData, setSavedData] = useState<DataStateV2>();

  useEffect(() => {
    const initialDataState = productionStore.getState().dataV2;

    setSavedData(initialDataState);
    const unsubscribe = dispatch(
      addListener({
        matcher: isAnyOf(...Object.values(dataSlice.actions)),
        effect: (action, listenerAPI) => {
          const hasUnsavedChanges = (listenerAPI.getState() as RootState)
            .imageViewerData.hasUnsavedChanges;
          if (hasUnsavedChanges) return;
          listenerAPI.dispatch(
            imageViewerDataSlice.actions.setHasUnsavedChanges(true),
          );
        },
      }),
    );
    return unsubscribe as unknown as UnsubscribeListener;
  }, []);

  useEffect(() => {
    const initialImageIds: string[] =
      routerLocation.state?.selectedItems?.imageIds ?? [];
    const initialAnnotationIds: string[] =
      routerLocation.state?.selectedItems?.annotationIds ?? [];
    batch(() => {
      dispatch(imageViewerDataSlice.actions.setImageStack(initialImageIds));
      dispatch(
        imageViewerDataSlice.actions.setActiveImageId(initialImageIds[0]),
      );
      // Annotations hand-picked in the ProjectViewer match no category or
      // feature criterion, so they seed the sticky include set.
      if (initialAnnotationIds.length)
        dispatch(
          imageViewerDataSlice.actions.toggleAnnotationSelection({
            ids: initialAnnotationIds,
            on: true,
          }),
        );
    });
  }, [routerLocation.state]);
  return (
    <DataContext.Provider value={{ savedData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useSavedDataState = () => {
  const savedDataState = useContext(DataContext);

  return savedDataState;
};
