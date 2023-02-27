import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ShadowImageType } from "types/ImageType";
import {
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
} from "types/Category";
import { ToolType } from "types/ToolType";
import {
  encodedAnnotationType,
  decodedAnnotationType,
} from "types/AnnotationType";
import { AnnotationModeType } from "types/AnnotationModeType";
import { AnnotationStateType } from "types/AnnotationStateType";
import { LanguageType } from "types/LanguageType";
import { Annotator } from "types/Annotator";
import { Colors } from "types/tensorflow";
import { AnnotationTool } from "annotator-tools";

import { replaceDuplicateName } from "utils/common/image";

const initialState: Annotator = {
  annotationState: AnnotationStateType.Blank,
  boundingClientRect:
    process.env.NODE_ENV !== "test"
      ? new DOMRect()
      : (undefined as unknown as DOMRect), // dummy for testing
  brightness: 0,
  currentIndex: 0,
  cursor: "default",
  contrast: 0,
  exposure: 0,
  hue: 0,
  activeImageId: undefined,
  activeImageRenderedSrcs: [],
  images: [],
  language: LanguageType.English,
  offset: { x: 0, y: 0 },
  penSelectionBrushSize: 10,
  pointerSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
  },
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  saturation: 0,
  workingAnnotation: undefined,
  selectedAnnotations: [],
  stagedAnnotations: [],
  stagedAnnotationsHaveBeenUpdated: false,
  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
  selectionMode: AnnotationModeType.New,
  soundEnabled: true,
  stageHeight: 1000,
  stageScale: 1,
  stageWidth: 1000,
  stagePosition: { x: 0, y: 0 },
  toolType: ToolType.RectangularAnnotation,
  vibrance: 0,
  zoomSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
    centerPoint: undefined,
  },
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "image-viewer-application",
  reducers: {
    resetAnnotator: () => initialState,
    addImages(
      state,
      action: PayloadAction<{ newImages: Array<ShadowImageType> }>
    ) {
      //we look for image name duplicates and append number if such duplicates are found
      const imageNames = state.images.map((image) => {
        return image.name.split(".")[0];
      });

      const updatedImages = action.payload.newImages.map((image) => {
        const initialName = image.name.split(".")[0]; //get name before file extension
        //add filename extension to updatedName
        const updatedName =
          replaceDuplicateName(initialName, imageNames) +
          "." +
          image.name.split(".")[1];
        return { ...image, name: updatedName };
      });

      state.images.push(...updatedImages);
    },
    clearCategoryAnnotations(
      state,
      action: PayloadAction<{ category: Category }>
    ) {
      // for (let image of state.images) {
      //   image.annotations = image.annotations.filter(
      //     (annotation: encodedAnnotationType) => {
      //       return annotation.categoryId !== action.payload.category.id;
      //     }
      //   );
      // }
      state.stagedAnnotations = state.stagedAnnotations.filter(
        (annotation) => annotation.categoryId !== action.payload.category.id
      );
    },
    deleteAllAnnotationCategories(state, action: PayloadAction<{}>) {
      state.images = state.images.map((image) => {
        const instances = image.annotations.map(
          (annotation: encodedAnnotationType) => {
            return {
              ...annotation,
              categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
            };
          }
        );

        return { ...image, annotations: instances };
      });
    },
    deleteAllImageAnnotations(
      state,
      action: PayloadAction<{ imageId: string }>
    ) {
      //deletes all instances across a given image
      if (action.payload.imageId === state.activeImageId) {
        state.stagedAnnotations = [];
        state.selectedAnnotations = [];
        state.workingAnnotation = undefined;
      } else {
        state.images = state.images.map((image) => {
          if (image.id === action.payload.imageId) {
            return { ...image, annotations: [] };
          } else return image;
        });
      }
    },
    deleteAllInstances(state) {
      //deletes all instances across all images
      state.images = state.images.map((image) => {
        return { ...image, annotations: [] };
      });
    },
    deleteAnnotationCategory(
      state,
      action: PayloadAction<{ categoryID: string }>
    ) {
      state.images = state.images.map((image) => {
        const instances = image.annotations.map(
          (annotation: encodedAnnotationType) => {
            if (annotation.categoryId === action.payload.categoryID) {
              return {
                ...annotation,
                categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
              };
            } else {
              return annotation;
            }
          }
        );

        return { ...image, annotations: instances };
      });
    },
    deleteImage(state, action: PayloadAction<{ id: string }>) {
      state.images = state.images.filter(
        (image) => image.id !== action.payload.id
      );
    },
    deleteImageInstances(
      //deletes given instance on active image
      state,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      if (!state.activeImageId) return;

      state.images = state.images.map((image) => {
        if (image.id === state.activeImageId) {
          const updatedAnnotations = image.annotations.filter(
            (annotation: encodedAnnotationType) => {
              return !action.payload.ids.includes(annotation.id);
            }
          );
          return { ...image, annotations: updatedAnnotations };
        } else return image;
      });
    },
    setActiveImageRenderedSrcs(
      state,
      action: PayloadAction<{
        renderedSrcs: Array<string>;
      }>
    ) {
      state.activeImageRenderedSrcs = action.payload.renderedSrcs;
    },
    setAnnotationState(
      state,
      action: PayloadAction<{
        annotationState: AnnotationStateType;
        annotationTool: AnnotationTool | undefined;
        execSaga: boolean;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },
    setBoundingClientRect(
      state,
      action: PayloadAction<{ boundingClientRect: DOMRect }>
    ) {
      state.boundingClientRect = action.payload.boundingClientRect;
    },
    setBrightness(state, action: PayloadAction<{ brightness: number }>) {
      state.brightness = action.payload.brightness;
    },
    setContrast(state, action: PayloadAction<{ contrast: number }>) {
      state.contrast = action.payload.contrast;
    },
    setCurrentIndex(state, action: PayloadAction<{ currentIndex: number }>) {
      state.currentIndex = action.payload.currentIndex;
    },
    setCursor(
      state,
      action: PayloadAction<{
        cursor: string;
      }>
    ) {
      state.cursor = action.payload.cursor;
    },
    setExposure(state, action: PayloadAction<{ exposure: number }>) {
      state.exposure = action.payload.exposure;
    },
    setHue(state, action: PayloadAction<{ hue: number }>) {
      state.hue = action.payload.hue;
    },
    setActiveImage: (
      state,
      action: PayloadAction<{
        imageId: string | undefined;
        prevImageId: string | undefined;
        execSaga: boolean;
      }>
    ) => {
      state.activeImageId = action.payload.imageId;

      // reset selected annotations
      state.selectedAnnotations = [];
      state.workingAnnotation = undefined;
    },
    setActiveImagePlane(
      state,
      action: PayloadAction<{ activeImagePlane: number }>
    ) {
      if (!state.activeImageId) return;

      const newPlane = action.payload.activeImagePlane;

      if (newPlane < 0 || newPlane >= state.activeImageRenderedSrcs.length)
        return;

      state.images = state.images.map((image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return {
            ...image,
            activePlane: newPlane,
            // change rendered src to match new active plane
            src: state.activeImageRenderedSrcs[newPlane],
          };
        }
      });
    },
    setImageColors(
      state,
      action: PayloadAction<{
        colors: Colors;
        execSaga: boolean;
      }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          image.colors.color.dispose();
          return { ...image, colors: action.payload.colors };
        }
      });
    },
    setImageInstances(
      state,
      action: PayloadAction<{
        instances: Array<encodedAnnotationType>;
        imageId: string;
      }>
    ) {
      //update corresponding image object in array of Images stored in state

      state.images = state.images.map((image) => {
        if (action.payload.imageId !== image.id) {
          return image;
        } else {
          return { ...image, annotations: action.payload.instances };
        }
      });
    },
    setInstances(
      state,
      action: PayloadAction<{
        instances: {
          [imageId: string]: Array<encodedAnnotationType>;
        };
      }>
    ) {
      // add individual annotations to several images

      state.images = state.images.map((im) => {
        const annotationsToAdd = action.payload.instances[im.id];
        if (annotationsToAdd) {
          return {
            ...im,
            annotations: [...im.annotations, ...annotationsToAdd],
          };
        } else {
          return im;
        }
      });
    },
    setImageSrc(state, action: PayloadAction<{ src: string }>) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, src: action.payload.src };
        }
      });
    },
    setImages(
      state,
      action: PayloadAction<{
        images: Array<ShadowImageType>;
        disposeColorTensors: boolean;
      }>
    ) {
      if (action.payload.disposeColorTensors) {
        for (const im of state.images) {
          action.payload.disposeColorTensors && im.colors.color.dispose();
        }
      }
      state.images = action.payload.images;
    },
    setLanguage(state, action: PayloadAction<{ language: LanguageType }>) {
      state.language = action.payload.language;
    },
    setOffset(
      state,
      action: PayloadAction<{ offset: { x: number; y: number } }>
    ) {
      state.offset = action.payload.offset;
    },
    setOperation(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setPointerSelection(
      state,
      action: PayloadAction<{
        pointerSelection: {
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
        };
      }>
    ) {
      state.pointerSelection = action.payload.pointerSelection;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },
    setSaturation(state, action: PayloadAction<{ saturation: number }>) {
      state.saturation = action.payload.saturation;
    },
    setSelectedAnnotations(
      state,
      action: PayloadAction<{
        selectedAnnotations: Array<decodedAnnotationType>;
        workingAnnotation: decodedAnnotationType | undefined;
      }>
    ) {
      state.selectedAnnotations = action.payload.selectedAnnotations.map(
        (annotation) => annotation.id
      );
      state.workingAnnotation = action.payload.workingAnnotation;
    },
    setSelectedCategoryId(
      state,
      action: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>
    ) {
      state.selectedCategoryId = action.payload.selectedCategoryId;
    },
    setSelectionMode(
      state,
      action: PayloadAction<{ selectionMode: AnnotationModeType }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setSoundEnabled(state, action: PayloadAction<{ soundEnabled: boolean }>) {
      state.soundEnabled = action.payload.soundEnabled;
    },
    setStagedAnnotations(
      state,
      action: PayloadAction<{ annotations: decodedAnnotationType[] }>
    ) {
      state.stagedAnnotations = action.payload.annotations;
    },
    setStageHeight(state, action: PayloadAction<{ stageHeight: number }>) {
      state.stageHeight = action.payload.stageHeight;
    },
    setStagePosition(
      state,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>
    ) {
      state.stagePosition = action.payload.stagePosition;
    },
    setStageScale(state, action: PayloadAction<{ stageScale: number }>) {
      state.stageScale = action.payload.stageScale;
    },
    setStageWidth(state, action: PayloadAction<{ stageWidth: number }>) {
      state.stageWidth = action.payload.stageWidth;
    },
    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
    setVibrance(state, action: PayloadAction<{ vibrance: number }>) {
      state.vibrance = action.payload.vibrance;
    },
    setZoomSelection(
      state,
      action: PayloadAction<{
        zoomSelection: {
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
          centerPoint: { x: number; y: number } | undefined;
        };
      }>
    ) {
      state.zoomSelection = action.payload.zoomSelection;
    },
    updateStagedAnnotations(
      state,
      action: PayloadAction<{ annotations?: decodedAnnotationType[] }>
    ) {
      if (!action.payload.annotations) {
        if (!state.workingAnnotation) return;
        const stagedIDIndex = state.stagedAnnotations.findIndex(
          (annotation) => annotation.id === state.workingAnnotation!.id
        );
        if (stagedIDIndex >= 0) {
          state.stagedAnnotations[stagedIDIndex] = state.workingAnnotation;
        } else {
          state.stagedAnnotations.push(state.workingAnnotation);
        }
      } else {
        const stagedIDs = state.stagedAnnotations.map(
          (annotation) => annotation.id
        );
        action.payload.annotations.forEach((annotation, idx) => {
          const annotationIndex = stagedIDs.findIndex(
            (id) => id === annotation.id
          );
          if (annotationIndex === -1) {
            state.stagedAnnotations.push(annotation!);
          } else {
            state.stagedAnnotations[annotationIndex] = annotation!;
          }
        });
      }
    },
  },
});

export const {
  addImages,
  deleteAllInstances,
  deleteImage,
  setActiveImage,
  setActiveImagePlane,
  setAnnotationState,
  setBoundingClientRect,
  setBrightness,
  setContrast,
  setCurrentIndex,
  setCursor,
  setExposure,
  setHue,
  setImageInstances,
  setImages,
  setLanguage,
  setOffset,
  setOperation,
  setPenSelectionBrushSize,
  setPointerSelection,
  setQuickSelectionRegionSize,
  setSaturation,
  setSelectedAnnotations,
  setSelectionMode,
  setSelectedCategoryId,
  setSoundEnabled,
  setStagedAnnotations,
  setStageHeight,
  setStagePosition,
  setStageScale,
  setStageWidth,
  setVibrance,
  setZoomSelection,
  deleteAnnotationCategory,
  updateStagedAnnotations,
  setInstances,
} = annotatorSlice.actions;
