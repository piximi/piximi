import { createListenerMiddleware } from "@reduxjs/toolkit";

import { dataSlice } from "./dataSlice";

import { imageViewerSlice } from "../imageViewer";
import { applicationSettingsSlice } from "../applicationSettings";

import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { createRenderedTensor } from "utils/common/tensorHelpers";

import { ImageObject } from "./types";
import { TypedAppStartListening } from "store/types";

export const dataMiddleware = createListenerMiddleware();

export const startAppListening =
  dataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: dataSlice.actions.deleteThings,
  effect: (action, listenerAPI) => {
    const state = listenerAPI.getState();
    const data = state.data;
    let explicitThingIds: string[] = [];

    if ("thingIds" in action.payload) {
      if (action.payload.thingIds === "all") {
        explicitThingIds = data.things.ids as string[];
      } else if (action.payload.thingIds === "annotations") {
        explicitThingIds = data.kinds.ids.reduce((tIds: string[], kindId) => {
          if (kindId !== "Image") {
            tIds.push(
              ...getDeferredProperty(data.kinds.entities[kindId], "containing")
            );
          }
          return tIds;
        }, []);
      } else {
        explicitThingIds = action.payload.thingIds;
      }
    } else if ("ofKinds" in action.payload) {
      action.payload.ofKinds.forEach((kindId) => {
        if (kindId in data.kinds.entities) {
          explicitThingIds.push(
            ...getDeferredProperty(data.kinds.entities[kindId], "containing")
          );
        }
      });
    } else {
      //"ofCategories" in action.payload
      action.payload.ofCategories.forEach((categoryId) => {
        if (categoryId in data.categories.entities) {
          let containedThings: string[];

          containedThings = getDeferredProperty(
            data.categories.entities[categoryId],
            "containing"
          );

          explicitThingIds.push(...containedThings);
        }
      });
    }

    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      dataSlice.actions.deleteThings({
        thingIds: explicitThingIds,
        disposeColorTensors: action.payload.disposeColorTensors,
        isPermanent: action.payload.isPermanent,
        preparedByListener: true,
      })
    );
    listenerAPI.subscribe();

    return;
  },
});

startAppListening({
  actionCreator: dataSlice.actions.addAnnotations,
  effect: (action, listenerAPI) => {
    action.payload.annotations.forEach((annotation) => {
      const imageId = annotation.imageId;
      if (imageId === listenerAPI.getState().imageViewer.activeImageId) {
        listenerAPI.dispatch(
          imageViewerSlice.actions.addActiveAnnotationId({
            annotationId: annotation.id,
          })
        );
      }
    });
  },
});

startAppListening({
  actionCreator: dataSlice.actions.updateThings,
  effect: async (action, listenerAPI) => {
    const { updates } = action.payload;
    const { data: dataState, imageViewer: imageViewerState } =
      listenerAPI.getState();

    const srcUpdates: Array<{ id: string } & Partial<ImageObject>> = [];
    let renderedSrcs: string[] = [];
    const numImages = updates.length;
    let imageNumber = 1;
    for await (const update of updates) {
      const { id: imageId, ...changes } = update;
      if ("colors" in changes && changes.colors) {
        const colors = changes.colors;
        const image = getCompleteEntity(
          dataState.things.entities[imageId]
        )! as ImageObject;

        const colorsEditable = {
          range: { ...colors.range },
          visible: { ...colors.visible },
          color: colors.color,
        };
        renderedSrcs = await createRenderedTensor(
          image.data,
          colorsEditable,
          image.bitDepth,
          undefined
        );

        srcUpdates.push({ id: imageId, src: renderedSrcs[image.activePlane] });
        if (imageId === imageViewerState.activeImageId) {
          listenerAPI.dispatch(
            imageViewerSlice.actions.setActiveImageRenderedSrcs({
              renderedSrcs,
            })
          );
        }
        listenerAPI.dispatch(
          applicationSettingsSlice.actions.setLoadMessage({
            message: `Updating image ${imageNumber} of ${numImages}`,
          })
        );
        imageNumber++;
      }
    }

    if (srcUpdates.length !== 0) {
      listenerAPI.unsubscribe();
      listenerAPI.dispatch(
        dataSlice.actions.updateThings({
          updates: srcUpdates,
        })
      );
      listenerAPI.subscribe();
    }
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.setLoadMessage({
        message: "",
      })
    );
  },
});
startAppListening({
  predicate: (action) => {
    const type = action.type.split("/");

    if (type[0] !== "data") return false;
    if (["initializeState", "resetData", "reconcile"].includes(type[1]))
      return false;
    if (
      action.payload &&
      "isPermanent" in action.payload &&
      action.payload.isPermanent
    )
      return false;
    return true;
  },
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setHasUnsavedChanges({ hasUnsavedChanges: true })
    );
  },
});

startAppListening({
  actionCreator: dataSlice.actions.reconcile,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(
      imageViewerSlice.actions.setHasUnsavedChanges({
        hasUnsavedChanges: false,
      })
    );
  },
});
