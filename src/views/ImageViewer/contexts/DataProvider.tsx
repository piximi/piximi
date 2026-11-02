import { createContext, useContext, useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

import { addListener, isAnyOf } from "@reduxjs/toolkit";

import { productionStore } from "store";
import { dataSlice } from "store/data";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import { annotatorSlice } from "@ImageViewer/state/annotator";
import { ToolType } from "@ImageViewer/utils/enums";

import type { ReactNode } from "react";

import type { UnsubscribeListener } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";
import type { DataStateV2 } from "store/data/types";

const DataContext = createContext<{
  initialDataSnapshot: DataStateV2 | undefined;
}>({ initialDataSnapshot: undefined });

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();
  const [initialDataSnapshot] = useState<DataStateV2>(
    () => productionStore.getState().data,
  );

  useEffect(() => {
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
  }, [dispatch]);

  useEffect(() => {
    const initialImageIds: string[] =
      routerLocation.state?.selectedItems?.imageIds ?? [];
    const initialAnnotationIds: string[] =
      routerLocation.state?.selectedItems?.annotationIds ?? [];
    let activeImageId = initialImageIds[0];
    const firstSelectedAnnotation = initialAnnotationIds[0];
    const initialDataState = productionStore.getState().data as DataStateV2;
    if (initialDataState && firstSelectedAnnotation) {
      const annotation =
        initialDataState.annotations.entities[firstSelectedAnnotation];
      // should always be true, but a guard in case it isnt
      if (initialImageIds.includes(annotation.imageId))
        activeImageId = annotation.imageId;
    }
    let isAnnotated = false;
    if (activeImageId)
      if (
        initialDataState &&
        Object.values(initialDataState.annotations.entities).some(
          (ann) => ann.imageId === activeImageId,
        )
      )
        isAnnotated = true;

    dispatch(imageViewerDataSlice.actions.setImageStack(initialImageIds));
    dispatch(imageViewerDataSlice.actions.setActiveImageId(activeImageId));

    // If the images have annotations, set the annotation tool to pointer
    if (isAnnotated)
      dispatch(annotatorSlice.actions.setToolType(ToolType.Pointer));
    // Annotations hand-picked in the ProjectViewer match no category or
    // feature criterion, so they seed the sticky include set.
    if (initialAnnotationIds.length) {
      dispatch(
        imageViewerDataSlice.actions.toggleAnnotationSelection({
          ids: initialAnnotationIds,
          on: true,
        }),
      );
    }
  }, [routerLocation.state, dispatch]);
  return (
    <DataContext.Provider value={{ initialDataSnapshot }}>
      {children}
    </DataContext.Provider>
  );
};

export const useInitialDataSnapshot = () => {
  const snapshot = useContext(DataContext);

  return snapshot;
};
