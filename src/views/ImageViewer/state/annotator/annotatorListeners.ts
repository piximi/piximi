import { createListenerMiddleware } from "@reduxjs/toolkit";
import { intersection } from "lodash";

import { annotatorSlice } from "./annotatorSlice";

import { imageViewerSlice } from "../imageViewer";

import { dataSlice } from "store/data";
import { applicationSettingsSlice } from "store/applicationSettings";
import {
  decodeAnnotation,
  encodeAnnotation,
} from "views/ImageViewer/utils/rle";
import { BlankAnnotationTool } from "views/ImageViewer/utils/tools";
import { getPropertiesFromImage } from "utils/common/helpers";
import { createRenderedTensor } from "utils/common/tensorHelpers";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import { TypedAppStartListening } from "store/types";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Kind,
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
  actionCreator: annotatorSlice.actions.setAnnotationState,
  effect: async (action, listenerAPI) => {
    const {
      imageViewer: IVState,
      data: dataState,
      annotator: annotatorState,
    } = listenerAPI.getState();
    const { annotationState, annotationTool, kind } = action.payload;

    if (
      annotationTool instanceof BlankAnnotationTool ||
      annotationState !== AnnotationState.Annotated ||
      !kind
    )
      return;

    const selectionMode = annotatorState.selectionMode;
    let kindObject: Kind;
    if (dataState.kinds.entities[kind]) {
      kindObject = dataState.kinds.entities[kind]!;
      if (annotatorState.changes.kinds.edited[kind]) {
        kindObject = {
          ...kindObject,
          ...annotatorState.changes.kinds.edited[kind],
        };
      }
    } else if (annotatorState.changes.kinds.added[kind]) {
      kindObject = annotatorState.changes.kinds.added[kind];
    } else {
      return;
    }

    const activeImageId = IVState.activeImageId;
    if (!activeImageId) return;
    let activeImage: ImageObject;
    if (dataState.things.entities[activeImageId]) {
      activeImage = dataState.things.entities[activeImageId]! as ImageObject;
      if (annotatorState.changes.things.edited[activeImageId]) {
        activeImage = {
          ...activeImage,
          ...annotatorState.changes.things.edited[activeImageId],
        };
      }
    } else {
      return;
    }

    const selectedAnnotationCategoryId = IVState.selectedCategoryId;
    let selectedCategory: Category;
    if (dataState.categories.entities[selectedAnnotationCategoryId]) {
      selectedCategory =
        dataState.categories.entities[selectedAnnotationCategoryId]!;
      if (
        annotatorState.changes.categories.edited[selectedAnnotationCategoryId]
      ) {
        selectedCategory = {
          ...selectedCategory,
          ...annotatorState.changes.categories.edited[
            selectedAnnotationCategoryId
          ],
        };
      }
    } else if (
      annotatorState.changes.categories.added[selectedAnnotationCategoryId]
    ) {
      selectedCategory =
        annotatorState.changes.categories.added[selectedAnnotationCategoryId];
    } else {
      return;
    }

    if (
      selectionMode === AnnotationMode.New &&
      annotationTool.annotationState === AnnotationState.Annotated
    ) {
      annotationTool.annotate(
        selectedCategory,
        activeImage!.activePlane,
        activeImageId
      );
      if (!annotationTool.annotation) return;
      const bbox = annotationTool.annotation.boundingBox;

      const bitDepth = activeImage.bitDepth;
      const imageProperties = await getPropertiesFromImage(
        activeImage,
        annotationTool.annotation!
      );
      //TODO: add suppoert for multiple planes
      const shape = {
        planes: 1,
        height: bbox[3] - bbox[1],
        width: bbox[2] - bbox[0],
        channels: activeImage.shape.channels,
      };

      const currentAnnotationNames = intersection(
        activeImage.containing,
        kindObject.containing
      ).map((id) => {
        return dataState.things.entities[id]!.name;
      });

      let annotationName: string = `${activeImage.name}-${kind}_0`;
      let i = 1;
      while (currentAnnotationNames.includes(annotationName)) {
        annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
        i++;
      }

      listenerAPI.dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: {
            ...annotationTool.annotation,
            ...imageProperties,
            bitDepth,
            shape,
            name: annotationName,
            kind,
          } as DecodedAnnotationObject,
        })
      );
    } else {
      const toolType = annotatorState.toolType;

      if (toolType === ToolType.Zoom) return;
      const savedWorkingAnnotation = annotatorState.workingAnnotation.saved;
      const workingAnnotationChanges = annotatorState.workingAnnotation.changes;
      if (
        !savedWorkingAnnotation ||
        annotationTool.annotationState !== AnnotationState.Annotated
      )
        return;
      const workingAnnotation = {
        ...savedWorkingAnnotation,
        ...workingAnnotationChanges,
      };
      let combinedMask, combinedBoundingBox;

      if (selectionMode === AnnotationMode.Add) {
        [combinedMask, combinedBoundingBox] = annotationTool.add(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationMode.Subtract) {
        [combinedMask, combinedBoundingBox] = annotationTool.subtract(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationMode.Intersect) {
        [combinedMask, combinedBoundingBox] = annotationTool.intersect(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else {
        return;
      }

      annotationTool.decodedMask = combinedMask;
      annotationTool.boundingBox = combinedBoundingBox;

      const combinedSelectedAnnotation = annotationTool.decodedMask.length
        ? {
            ...workingAnnotation,
            boundingBox: annotationTool.boundingBox,
            decodedMask: annotationTool.decodedMask,
          }
        : undefined;

      if (!combinedSelectedAnnotation) return;

      const annotation = encodeAnnotation(combinedSelectedAnnotation);

      listenerAPI.dispatch(
        annotatorSlice.actions.updateWorkingAnnotation({
          changes: annotation!,
        })
      );

      if (annotationTool.decodedMask.length) {
        annotationTool.annotate(
          selectedCategory,
          activeImage.activePlane,
          activeImageId,
          annotation.id
        );
      }
    }
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
      })
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
      })
    );
    for (const id in kindChanges.deleted) {
      listenerAPI.dispatch(dataSlice.actions.deleteKind({ deletedKindId: id }));
    }
    listenerAPI.dispatch(
      dataSlice.actions.addCategories({
        categories: Object.values(categoryChanges.added),
      })
    );

    listenerAPI.dispatch(
      dataSlice.actions.deleteCategories({
        categoryIds: categoryChanges.deleted,
      })
    );

    listenerAPI.dispatch(
      dataSlice.actions.addThings({
        things: Object.values(thingChanges.added) as Array<
          ImageObject | AnnotationObject
        >,
      })
    );
    listenerAPI.dispatch(
      dataSlice.actions.updateThings({
        updates: Object.values(thingChanges.edited),
      })
    );
    listenerAPI.dispatch(
      dataSlice.actions.deleteThings({
        thingIds: thingChanges.deleted,

        disposeColorTensors: true,
      })
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
        annotatorSlice.actions.editThings({
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
