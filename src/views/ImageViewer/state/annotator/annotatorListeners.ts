import { createListenerMiddleware } from "@reduxjs/toolkit";

import { annotatorSlice } from "./annotatorSlice";

import { imageViewerSlice } from "../imageViewer";

import { dataSlice } from "store/data";
import { applicationSettingsSlice } from "store/applicationSettings";
import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { createRenderedTensor } from "utils/common/tensorHelpers";

import { ToolType } from "views/ImageViewer/utils/enums";

import { TypedAppStartListening } from "store/types";
import {
  AnnotationObject,
  DecodedAnnotationObject,
  ImageObject,
} from "store/data/types";

export const annotatorMiddleware = createListenerMiddleware();

const startAppListening =
  annotatorMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: applicationSettingsSlice.actions.resetApplicationState,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(annotatorSlice.actions.resetAnnotator());
  },
});

startAppListening({
  actionCreator: annotatorSlice.actions.setWorkingAnnotation,
  effect: async (action, listenerAPI) => {
    const dataState = listenerAPI.getState().data;
    let annotationValue = action.payload.annotation;
    if (typeof annotationValue === "string") {
      const annotation = dataState.things.entities[
        annotationValue
      ] as AnnotationObject;
      if (!annotation) return undefined;
      annotationValue = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
    }
    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: annotationValue,
        preparedByListener: true,
      }),
    );
    listenerAPI.subscribe();
  },
});
startAppListening({
  actionCreator: annotatorSlice.actions.setToolType,
  effect: (action, listenerAPI) => {
    const { operation } = action.payload;
    let cursor: string;
    switch (operation) {
      case ToolType.RectangularAnnotation:
      case ToolType.EllipticalAnnotation:
        cursor = "crosshair";
        break;
      case ToolType.PenAnnotation:
        cursor = "none";
        break;
      default:
        cursor = "pointer";
    }

    listenerAPI.dispatch(imageViewerSlice.actions.setCursor({ cursor }));
  },
});

startAppListening({
  actionCreator: annotatorSlice.actions.reconcileChanges,
  effect: (action, listenerAPI) => {
    const { discardChanges } = action.payload;
    if (discardChanges) {
      return;
    }
    const { annotator: annotatorState } = listenerAPI.getState();
    const {
      kinds: kindChanges,
      categories: categoryChanges,
      things: thingChanges,
    } = annotatorState.changes;

    listenerAPI.dispatch(
      dataSlice.actions.addKinds({
        kinds: Object.values(kindChanges.added),
      }),
    );
    for (const id in kindChanges.deleted) {
      listenerAPI.dispatch(dataSlice.actions.deleteKind({ deletedKindId: id }));
    }

    for (const id in kindChanges.edited) {
      const newDisplayName = kindChanges.edited[id].displayName;
      if (!newDisplayName) {
        continue;
      }
      listenerAPI.dispatch(
        dataSlice.actions.updateKindName({
          kindId: id,
          displayName: newDisplayName,
        }),
      );
    }
    listenerAPI.dispatch(
      dataSlice.actions.addCategories({
        categories: Object.values(categoryChanges.added),
      }),
    );

    listenerAPI.dispatch(
      dataSlice.actions.deleteCategories({
        categoryIds: categoryChanges.deleted,
      }),
    );

    listenerAPI.dispatch(
      dataSlice.actions.addThings({
        things: Object.values(thingChanges.added) as Array<
          ImageObject | AnnotationObject
        >,
      }),
    );
    listenerAPI.dispatch(
      dataSlice.actions.updateThings({
        updates: Object.values(thingChanges.edited),
      }),
    );
    listenerAPI.dispatch(
      dataSlice.actions.deleteThings({
        thingIds: thingChanges.deleted,

        disposeColorTensors: true,
      }),
    );
  },
});

startAppListening({
  actionCreator: annotatorSlice.actions.editThings,
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
        const image = dataState.things.entities[imageId]! as ImageObject;

        const colorsEditable = {
          range: { ...colors.range },
          visible: { ...colors.visible },
          color: colors.color,
        };
        renderedSrcs = await createRenderedTensor(
          image.data,
          colorsEditable,
          image.bitDepth,
          undefined,
        );

        srcUpdates.push({ id: imageId, src: renderedSrcs[image.activePlane] });
        if (imageId === imageViewerState.activeImageId) {
          listenerAPI.dispatch(
            imageViewerSlice.actions.setActiveImageRenderedSrcs({
              renderedSrcs,
            }),
          );
        }
        listenerAPI.dispatch(
          applicationSettingsSlice.actions.setLoadMessage({
            message: `Updating image ${imageNumber} of ${numImages}`,
          }),
        );
        imageNumber++;
      }
    }

    if (srcUpdates.length !== 0) {
      listenerAPI.unsubscribe();
      listenerAPI.dispatch(
        annotatorSlice.actions.editThings({
          updates: srcUpdates,
        }),
      );
      listenerAPI.subscribe();
    }
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.setLoadMessage({
        message: "",
      }),
    );
  },
});
