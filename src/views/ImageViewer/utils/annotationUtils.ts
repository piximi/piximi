import { DataArray, TSAnnotationObject } from "store/data/types";
import IJSImage from "image-js";
import { getPropertiesFromImage } from "store/data/utils";
import { convertToDataArray } from "utils/dataUtils";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Kind,
  PartialDecodedAnnotationObject,
} from "store/data/types";
import { encode, encodeAnnotation } from "./rle";
import { AnnotationMode } from "./enums";
import { AnnotationTool } from "./tools";
import { generateUUID } from "store/data/utils";
import {
  AnnotatorChanges,
  CategoryEdits,
  KindEdits,
  ProtoAnnotationObject,
} from "./types";
import { productionStore } from "store";
import { DataState } from "store/types";
import { difference } from "lodash";
import { RequireOnly } from "utils/types";
import { batch } from "react-redux";
import { dataSlice } from "store/data";
import { annotatorSlice } from "../state/annotator";
import { imageViewerSlice } from "../state/imageViewer";

/**
 * Checks if a point lies within an annotation bounding box
 * @param x x-coord of point
 * @param y y-coord of point
 * @param boundingBox Bounding box of annotation
 * @returns true if point lies within the bounding box, false otherwise
 */
export const isInBoundingBox = (
  x: number,
  y: number,
  boundingBox: [number, number, number, number],
) => {
  if (x < 0 || y < 0) return false;
  if (x >= boundingBox[2] - boundingBox[0]) return false;
  if (y >= boundingBox[3] - boundingBox[1]) return false;
  return true;
};

export const createProtoAnnotation = (
  partialAnnotation: Omit<PartialDecodedAnnotationObject, "id">,
  activeImage: ImageObject,
  kindObject: Kind,
  existingNames: string[],
): ProtoAnnotationObject => {
  const bbox = partialAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  let annotationName: string = `${activeImage.name}-${kindObject.id}_0`;
  let i = 1;
  while (existingNames.includes(annotationName)) {
    annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
    i++;
  }
  const annotationId = generateUUID();
  return {
    ...partialAnnotation,
    bitDepth,
    shape,
    name: annotationName,
    kind: kindObject.id,
    id: annotationId,
  };
};

export const createAnnotation = async (
  partialAnnotation: Omit<PartialDecodedAnnotationObject, "id">,
  activeImage: ImageObject,
  kindObject: Kind,
  existingNames: string[],
) => {
  const bbox = partialAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;
  const imageProperties = await getPropertiesFromImage(
    activeImage,
    partialAnnotation,
  );
  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  let annotationName: string = `${activeImage.name}-${kindObject.id}_0`;
  let i = 1;
  while (existingNames.includes(annotationName)) {
    annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
    i++;
  }
  const annotationId = generateUUID();
  return {
    ...partialAnnotation,
    ...imageProperties,
    bitDepth,
    shape,
    name: annotationName,
    kind: kindObject.id,
    id: annotationId,
  } as DecodedAnnotationObject;
};

export const editProtoAnnotation = async (
  workingAnnotation: ProtoAnnotationObject,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
  activeImage: ImageObject,
): Promise<ProtoAnnotationObject> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  } as DecodedAnnotationObject;

  const annotation = encodeAnnotation(combinedSelectedAnnotation);

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: combinedBoundingBox[3] - combinedBoundingBox[1],
    width: combinedBoundingBox[2] - combinedBoundingBox[0],
    channels: activeImage.shape.channels,
  };

  return { ...annotation, shape } as ProtoAnnotationObject;
};

export const editAnnotation = async (
  workingAnnotation: DecodedAnnotationObject,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
  activeImage: ImageObject,
): Promise<AnnotationObject | DecodedAnnotationObject> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  } as DecodedAnnotationObject;

  const annotation = encodeAnnotation(combinedSelectedAnnotation);
  const { data, src } = await getPropertiesFromImage(activeImage, annotation);

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: combinedBoundingBox[3] - combinedBoundingBox[1],
    width: combinedBoundingBox[2] - combinedBoundingBox[0],
    channels: activeImage.shape.channels,
  };

  return { ...annotation, data, src, shape } as AnnotationObject;
};

/**
 * Invert the selected annotation area
 * @param selectedMask
 * @param selectedBoundingBox
 * @returns Bounding box and encodedMask of the inverted annotation area
 */
export const invert = (
  selectedMask: DataArray,
  selectedBoundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [Uint8Array, [number, number, number, number]] => {
  const encodedMask = selectedMask;

  // Find min and max boundary points when computing the encodedMask.
  const invertedBoundingBox: [number, number, number, number] = [
    imageWidth,
    imageHeight,
    0,
    0,
  ];

  const invertedMask = new IJSImage(imageWidth, imageHeight, {
    components: 1,
    alpha: 0,
  });
  for (let x = 0; x < imageWidth; x++) {
    for (let y = 0; y < imageHeight; y++) {
      const x_encodedMask = x - selectedBoundingBox[0];
      const y_encodedMask = y - selectedBoundingBox[1];
      const value =
        encodedMask[
          x_encodedMask +
            y_encodedMask * (selectedBoundingBox[2] - selectedBoundingBox[0])
        ];
      if (
        value > 0 &&
        isInBoundingBox(x_encodedMask, y_encodedMask, selectedBoundingBox)
      ) {
        invertedMask.setPixelXY(x, y, [0]);
      } else {
        invertedMask.setPixelXY(x, y, [255]);
        if (x < invertedBoundingBox[0]) {
          invertedBoundingBox[0] = x;
        } else if (x > invertedBoundingBox[2]) {
          invertedBoundingBox[2] = x + 1;
        }
        if (y < invertedBoundingBox[1]) {
          invertedBoundingBox[1] = y;
        } else if (y > invertedBoundingBox[3]) {
          invertedBoundingBox[3] = y + 1;
        }
      }
    }
  }

  // Crop the encodedMask using the new bounding box.
  const croppedInvertedMask = invertedMask.crop({
    x: invertedBoundingBox[0],
    y: invertedBoundingBox[1],
    width: invertedBoundingBox[2] - invertedBoundingBox[0],
    height: invertedBoundingBox[3] - invertedBoundingBox[1],
  });

  return [
    convertToDataArray(8, croppedInvertedMask.data) as Uint8Array,
    invertedBoundingBox,
  ];
};

const reconcileKinds = (
  dataState: DataState,
  kindChanges: {
    added: Record<string, Kind>;
    deleted: string[];
    edited: Record<string, KindEdits>;
  },
) => {
  const kindUpdates: Array<{
    id: string;
    changes: Omit<Partial<Kind>, "id">;
  }> = [];

  for (const id in kindChanges.edited) {
    const editedKind = kindChanges.edited[id];
    const existingKind = dataState.kinds.entities[id]!;
    const updates: {
      id: string;
      changes: Omit<Partial<Kind>, "id">;
    } = { id: editedKind.id, changes: {} };
    if (editedKind.displayName) {
      updates.changes.displayName = editedKind.displayName;
    }
    if (editedKind.categories) {
      let updatedCategories = [...existingKind.categories];
      updatedCategories.push(...editedKind.categories.added);
      updatedCategories = difference(
        updatedCategories,
        editedKind.categories.deleted,
      );
      updates.changes.categories = updatedCategories;
    }
    if (editedKind.containing) {
      let updatedthings = [...existingKind.containing];
      updatedthings.push(...editedKind.containing.added);
      updatedthings = difference(updatedthings, editedKind.containing.deleted);
      updates.changes.containing = updatedthings;
    }
    kindUpdates.push(updates);
  }

  return {
    newKinds:
      Object.keys(kindChanges.added).length > 0
        ? Object.values(kindChanges.added)
        : undefined,
    updatedKinds: kindUpdates.length > 0 ? kindUpdates : undefined,
    deletedKinds:
      kindChanges.deleted.length > 0 ? kindChanges.deleted : undefined,
  };
};

const reconcileCategories = (
  dataState: DataState,
  categoryChanges: {
    added: Record<string, Category>;
    deleted: string[];
    edited: Record<string, CategoryEdits>;
  },
) => {
  const categoryUpdates: Array<{
    id: string;
    changes: Omit<Partial<Category>, "id">;
  }> = [];

  for (const id in categoryChanges.edited) {
    const editedCategory = categoryChanges.edited[id];
    const existingCategory = dataState.categories.entities[id]!;
    const updates: {
      id: string;
      changes: Omit<Partial<Kind>, "id">;
    } = { id: editedCategory.id, changes: {} };
    if (editedCategory.containing) {
      let updatedthings = [...existingCategory.containing];
      updatedthings.push(...editedCategory.containing.added);
      updatedthings = difference(
        updatedthings,
        editedCategory.containing.deleted,
      );
      updates.changes.containing = updatedthings;
    }
    categoryUpdates.push(updates);
  }

  return {
    newCategories:
      Object.keys(categoryChanges.added).length > 0
        ? Object.values(categoryChanges.added)
        : undefined,
    updatedCategories: categoryUpdates.length > 0 ? categoryUpdates : undefined,
    deletedCategories:
      categoryChanges.deleted.length > 0 ? categoryChanges.deleted : undefined,
  };
};

const reconcileThings = async (
  dataState: DataState,
  thingChanges: {
    added: Record<string, ProtoAnnotationObject>;
    deleted: string[];
    edited: Record<string, RequireOnly<ProtoAnnotationObject, "id">>;
  },
) => {
  const thingChangesPerImage: Record<
    string,
    { added: string[]; deleted: string[] }
  > = {};
  const newAnnotations: Array<AnnotationObject | TSAnnotationObject> = [];
  if (Object.keys(thingChanges.added).length > 0) {
    for await (const thing of Object.values(thingChanges.added)) {
      const imageId = thing.imageId;
      const image = dataState.things.entities[imageId]! as ImageObject;
      const annotationData = await getPropertiesFromImage(image, thing);
      const encodedMask = encode(thing.decodedMask);
      newAnnotations.push({ ...thing, ...annotationData, encodedMask });
      if (imageId in thingChangesPerImage) {
        thingChangesPerImage[imageId].added.push(thing.id);
      } else {
        thingChangesPerImage[imageId] = { added: [thing.id], deleted: [] };
      }
    }
  }
  const updates: {
    id: string;
    changes: Omit<Partial<AnnotationObject>, "id">;
  }[] = [];
  if (Object.keys(thingChanges.edited).length > 0) {
    for await (const thing of Object.values(thingChanges.edited)) {
      const id = thing.id;
      const { id: _id, ...changes } = thing;
      if (changes.decodedMask) {
        let imageId = (dataState.things.entities[id] as AnnotationObject)
          .imageId;
        if (!imageId) {
          imageId = thingChanges.added[id].imageId;
        }
        const image = dataState.things.entities[imageId]! as ImageObject;
        if (!image) {
          throw new Error("Image not found");
        }
        const annotationData = await getPropertiesFromImage(image, {
          boundingBox: changes.boundingBox!,
        });
        const encodedMask = encode(changes.decodedMask);
        Object.assign(changes, annotationData, { encodedMask });
      }
      updates.push({
        id,
        changes,
      });
    }
  }

  if (thingChanges.deleted.length > 0) {
    for (const thingId of thingChanges.deleted) {
      const thing = dataState.things.entities[thingId]! as AnnotationObject;
      const imageId = thing.imageId;
      if (imageId in thingChangesPerImage) {
        thingChangesPerImage[imageId].deleted.push(thing.id);
      } else {
        thingChangesPerImage[imageId] = { added: [], deleted: [thing.id] };
      }
    }
  }
  return {
    newAnnotations: newAnnotations.length > 0 ? newAnnotations : undefined,
    updatedAnnotations: updates.length > 0 ? updates : undefined,
    deletedAnnotations:
      thingChanges.deleted.length > 0 ? thingChanges.deleted : undefined,
    thingChangesPerImage,
  };
};

const reconcileImages = (
  dataState: DataState,
  thingChangesPerImage: Record<
    string,
    {
      added: string[];
      deleted: string[];
    }
  >,
) => {
  const imageChanges = Object.entries(thingChangesPerImage).map((entry) => {
    const image = dataState.things.entities[entry[0]]! as ImageObject;
    let updatedthings = [...image.containing];
    updatedthings.push(...entry[1].added);
    updatedthings = difference(updatedthings, entry[1].deleted);
    return { id: image.id, changes: { containing: updatedthings } };
  });
  return imageChanges.length > 0 ? imageChanges : undefined;
};
export const reconcileChanges = async (
  dataState: DataState,
  annotatorChanges: AnnotatorChanges,
) => {
  const {
    kinds: kindChanges,
    categories: categoryChanges,
    things: thingChanges,
  } = annotatorChanges;

  const { newKinds, updatedKinds, deletedKinds } = reconcileKinds(
    dataState,
    kindChanges,
  );

  const { newCategories, updatedCategories, deletedCategories } =
    reconcileCategories(dataState, categoryChanges);
  const {
    newAnnotations,
    updatedAnnotations,
    deletedAnnotations,
    thingChangesPerImage,
  } = await reconcileThings(dataState, thingChanges);
  const imageChanges = reconcileImages(dataState, thingChangesPerImage);

  batch(() => {
    if (newKinds)
      productionStore.dispatch(dataSlice.actions.addKinds({ kinds: newKinds }));
    if (updatedKinds)
      productionStore.dispatch(
        dataSlice.actions.updateKinds_unsafe({ updates: updatedKinds }),
      );
    if (deletedKinds)
      productionStore.dispatch(
        dataSlice.actions.deleteKinds({ kindIds: deletedKinds }),
      );
    if (newCategories)
      productionStore.dispatch(
        dataSlice.actions.addCategories_unsafe({ categories: newCategories }),
      );
    if (updatedCategories)
      productionStore.dispatch(
        dataSlice.actions.updateCategories_unsafe({
          updates: updatedCategories,
        }),
      );
    if (deletedCategories)
      productionStore.dispatch(
        dataSlice.actions.deleteCategories({ categoryIds: deletedCategories }),
      );
    if (newAnnotations)
      productionStore.dispatch(
        dataSlice.actions.addTSAnnotations_unsafe({
          annotations: newAnnotations as TSAnnotationObject[],
        }),
      );
    if (updatedAnnotations)
      productionStore.dispatch(
        dataSlice.actions.updateThings_unsafe({ updates: updatedAnnotations }),
      );
    if (deletedAnnotations)
      productionStore.dispatch(
        dataSlice.actions.deleteThings_unsafe({
          thingIds: deletedAnnotations,
          disposeColorTensors: true,
        }),
      );
    if (imageChanges)
      productionStore.dispatch(
        dataSlice.actions.updateImageContents_unsafe({ updates: imageChanges }),
      );
    productionStore.dispatch(annotatorSlice.actions.resetChanges());
    productionStore.dispatch(
      imageViewerSlice.actions.setHasUnsavedChanges({
        hasUnsavedChanges: false,
      }),
    );
  });
};
