import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { dataSlice } from "./dataSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { intersection } from "lodash";
import { DeferredEntity } from "store/entities/models";
import { projectSlice } from "../project";
import { imageViewerSlice } from "../imageViewer";
import { createRenderedTensor } from "utils/common/tensorHelpers";
import { ImageObject } from "./types";

export const newDataMiddleware = createListenerMiddleware();

export const startAppListening =
  newDataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: dataSlice.actions.deleteThings,
  effect: (action, listenerAPI) => {
    const state = listenerAPI.getState();
    const newData = state.newData;
    const project = state.project;
    let explicitThingIds: string[] = [];
    let implicitThingIds: string[] = [];

    if ("thingIds" in action.payload) {
      if (action.payload.thingIds === "all") {
        explicitThingIds = newData.things.ids as string[];
      } else if (action.payload.thingIds === "annotations") {
        explicitThingIds = newData.kinds.ids.reduce(
          (tIds: string[], kindId) => {
            if (kindId !== "Image") {
              tIds.push(
                ...getDeferredProperty(
                  newData.kinds.entities[kindId],
                  "containing"
                )
              );
            }
            return tIds;
          },
          []
        );
      } else {
        explicitThingIds = action.payload.thingIds;
      }
    } else if ("ofKinds" in action.payload) {
      action.payload.ofKinds.forEach((kindId) => {
        if (kindId in newData.kinds.entities) {
          explicitThingIds.push(
            ...getDeferredProperty(newData.kinds.entities[kindId], "containing")
          );
        }
      });
    } else {
      //"ofCategories" in action.payload
      action.payload.ofCategories.forEach((categoryId) => {
        if (categoryId in newData.categories.entities) {
          let containedThings: string[];

          containedThings = getDeferredProperty(
            newData.categories.entities[categoryId],
            "containing"
          );

          explicitThingIds.push(...containedThings);
        }
      });
    }

    for (const thingId of explicitThingIds) {
      const thing = newData.things.entities[thingId];
      if (!thing) continue;
      if (getDeferredProperty(thing, "kind") === "Image") {
        const containedThingIds = getDeferredProperty(
          thing as DeferredEntity<ImageObject>,
          "containing"
        );
        implicitThingIds.push(...containedThingIds);
      }
    }

    const selectedThings = project.selectedThingIds;

    const deletedThingsToDeselect = intersection(
      [...explicitThingIds, ...implicitThingIds],
      selectedThings
    );

    listenerAPI.dispatch(
      projectSlice.actions.deselectThings({ ids: deletedThingsToDeselect })
    );

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
    const { newData: dataState, imageViewer: imageViewerState } =
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
          projectSlice.actions.setLoadMessage({
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
      projectSlice.actions.setLoadMessage({
        message: "",
      })
    );
  },
});
