import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { DataState } from "store/types";
import { useLocation } from "react-router-dom";
import { prepareImageViewerData } from "./image-viewer-data/utils";
import { addListener, isAnyOf, UnsubscribeListener } from "@reduxjs/toolkit";
import { dataSlice } from "store/data";
import { imageViewerDataSlice } from "./image-viewer-data/ImageViewerDataSlice";
import { productionStore } from "store";
import { freezeState } from "store/data/utils";
import { RootState } from "store/rootReducer";

export const DataContext = createContext<{
  savedData: DataState | undefined;
}>({ savedData: undefined });

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();
  const [savedData, setSavedData] = useState<DataState>();

  useEffect(() => {
    const baseDataState = productionStore.getState().data;
    const frozenState = freezeState(baseDataState);
    setSavedData(frozenState);
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
    const initialDataIds = routerLocation.state?.initialThingIds
      ? routerLocation.state.initialThingIds
      : { images: [], annotations: [] };
    prepareImageViewerData(initialDataIds);
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
