import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener } from "@reduxjs/toolkit";
import { RootState } from "store/reducer/reducer";
import { AppDispatch } from "store/stores/productionStore";

export const dataMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening =
  dataMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;

// startAppListening({
//   predicate: (action, currentState: RootState, previousState: RootState) => {
//     return (
//       currentState.data.annotations.ids !== previousState.data.annotations.ids
//     );
//   },
//   effect: (action, listenerAPI) => {
//     //console.log((listenerAPI.getState() as any).data.annotations.ids);
//   },
// });

// startAppListening({
//   predicate: (action, currentState: RootState, previousState: RootState) => {
//     return currentState.annotator.activeImageId !== previousState.annotator.activeImageId;
//   },
//   effect: async (action, listenerAPI) => {
//     const currentStore = listenerAPI.getState().data;
//     if (!currentStore.activeImage) return;
//     const image = currentStore.images.entities[currentStore.activeImage];
//     const tmpRenderedSrc = Array(image.shape.planes);
//     tmpRenderedSrc[image.activePlane] = image.src;
//     listenerAPI.dispatch(
//       setActiveImageRenderedSrcs({ renderedSrcs: tmpRenderedSrc })
//     );
//     const renderedSrcs = await createRenderedTensor(
//       image.data,
//       image.colors,
//       image.bitDepth,
//       undefined
//     );
//     listenerAPI.dispatch(
//       setActiveImageRenderedSrcs({ renderedSrcs: renderedSrcs })
//     );
//   },
// });
