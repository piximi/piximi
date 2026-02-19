import { tensor4d } from "@tensorflow/tfjs";

import { initialState as initialProjectState } from "store/project/projectSlice";
import { DataState } from "store/types";
import {
  AnnotationObject,
  Category,
  ImageMetadata,
  ImageObject,
  Kind,
} from "store/data/types";
import {
  DeserializeProjectOutput,
  DeserializedImageResult,
  DeserializedAnnotationResult,
} from "workers/scheduler/types";

// RTK entity adapters for building EntityState
import {
  kindsAdapter,
  categoriesAdapter,
  metadataAdapter,
  imageDataAdapter,
  annotationsAdapter,
  trackletAdapter,
} from "store/data/dataSlice";

/**
 * Converts worker output into Redux-ready DataState.
 *
 * Creates placeholder tensors for image.data and annotation.data
 * (actual data is in IndexedDB, loaded lazily by Phase 4 hooks).
 *
 * This is analogous to buildReduxPayload() in useUploadPipeline,
 * but operates on a full project instead of individual uploads.
 */
export function buildProjectPayload(output: DeserializeProjectOutput): {
  data: DataState;
  project: DeserializeProjectOutput["project"];
  classifier: DeserializeProjectOutput["classifier"];
  segmenter: DeserializeProjectOutput["segmenter"];
} {
  // --- Kinds ---
  const kinds: Kind[] = Object.values(output.kinds);

  // --- Categories ---
  const categories: Category[] = Object.values(output.categories);

  // --- Metadata ---
  const metadata: ImageMetadata[] = output.metadata;

  // --- Images (with placeholder tensors) ---
  const images: ImageObject[] = output.images.map(
    (img: DeserializedImageResult) => ({
      id: img.id,
      name: img.name,
      metadataId: img.metadataId,
      colors: img.colors,
      categoryId: img.categoryId,
      activePlane: img.activePlane,
      partition: img.partition,
      timepoint: img.timepoint,
      // Placeholder — real data in IndexedDB
      src: "",
      data: tensor4d([[[[0], [0], [0]]]]),
      tensorRef: img.tensorRef,
    }),
  );

  // --- Annotations (with placeholder tensors) ---
  const annotations: AnnotationObject[] = output.annotations.map(
    (ann: DeserializedAnnotationResult) => ({
      id: ann.id,
      name: ann.name,
      kind: ann.kind,
      bitDepth: ann.bitDepth,
      partition: ann.partition,
      boundingBox: ann.boundingBox,
      encodedMask: ann.encodedMask,
      decodedMask: ann.decodedMask,
      plane: ann.plane,
      imageId: ann.imageId,
      timepoint: ann.timepoint,
      categoryId: ann.categoryId,
      shape: ann.shape,
      activePlane: ann.activePlane,
      // Placeholder — real data in IndexedDB
      src: "",
      data: tensor4d([[[[0], [0], [0]]]]),
      tensorRef: ann.tensorRef,
    }),
  );

  // --- Build EntityState objects ---
  const kindsState = kindsAdapter.setAll(kindsAdapter.getInitialState(), kinds);
  const categoriesState = categoriesAdapter.setAll(
    categoriesAdapter.getInitialState(),
    categories,
  );
  const metadataState = metadataAdapter.setAll(
    metadataAdapter.getInitialState(),
    metadata,
  );
  const imagesState = imageDataAdapter.setAll(
    imageDataAdapter.getInitialState(),
    images,
  );
  const annotationsState = annotationsAdapter.setAll(
    annotationsAdapter.getInitialState(),
    annotations,
  );
  const trackletsState = trackletAdapter.getInitialState();

  // --- Relationships ---
  // DeserializeProjectOutput.data doesn't include relationships directly.
  // They were computed during readV12 and are embedded in the output structure.
  // We need to rebuild them from the entity references.
  const relationships = buildRelationships(
    kinds,
    categories,
    images,
    annotations,
    metadata,
  );

  const data: DataState = {
    kinds: kindsState,
    categories: categoriesState,
    metadata: metadataState,
    images: imagesState,
    annotations: annotationsState,
    relationships,
    tracklets: trackletsState,
  };

  return {
    data,
    project: { ...initialProjectState, ...output.project },
    classifier: output.classifier,
    segmenter: output.segmenter,
  };
}
function buildRelationships(
  kinds: Kind[],
  categories: Category[],
  images: ImageObject[],
  annotations: AnnotationObject[],
  metadata: ImageMetadata[],
): DataState["relationships"] {
  const kindToCategories: Record<string, string[]> = {};
  const kindToAnnotations: Record<string, string[]> = {};
  const categoryToAnnotations: Record<string, string[]> = {};
  const categoryToImages: Record<string, string[]> = {};
  const imageToAnnotations: Record<string, string[]> = {};
  const metadataToTracklets: Record<string, string[]> = {};

  // Initialize empty arrays for each entity
  for (const kind of kinds) {
    kindToCategories[kind.id] = [];
    kindToAnnotations[kind.id] = [];
  }
  for (const cat of categories) {
    categoryToAnnotations[cat.id] = [];
    categoryToImages[cat.id] = [];
  }
  for (const img of images) {
    imageToAnnotations[img.id] = [];
  }
  for (const md of metadata) {
    metadataToTracklets[md.id] = [];
  }

  // Populate from entity references
  for (const cat of categories) {
    if (cat.kind && kindToCategories[cat.kind]) {
      kindToCategories[cat.kind].push(cat.id);
    }
  }
  for (const img of images) {
    if (img.categoryId && categoryToImages[img.categoryId]) {
      categoryToImages[img.categoryId].push(img.id);
    }
  }
  for (const ann of annotations) {
    if (ann.kind && kindToAnnotations[ann.kind]) {
      kindToAnnotations[ann.kind].push(ann.id);
    }
    if (ann.categoryId && categoryToAnnotations[ann.categoryId]) {
      categoryToAnnotations[ann.categoryId].push(ann.id);
    }
    if (ann.imageId && imageToAnnotations[ann.imageId]) {
      imageToAnnotations[ann.imageId].push(ann.id);
    }
  }

  return {
    kindToCategories,
    kindToAnnotations,
    categoryToAnnotations,
    categoryToImages,
    imageToAnnotations,
    metadataToTracklets,
  };
}
