import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ShadowImageType } from "types/ImageType";
import { Category, UNKNOWN_ANNOTATION_CATEGORY } from "../../types/Category";
import { ToolType } from "../../types/ToolType";
import { AnnotationType } from "../../types/AnnotationType";
import { AnnotationModeType } from "../../types/AnnotationModeType";
import { AnnotationStateType } from "../../types/AnnotationStateType";
import { LanguageType } from "../../types/LanguageType";
import * as tensorflow from "@tensorflow/tfjs";
import { ImageViewer } from "../../types/ImageViewer";
import { SerializedAnnotationType } from "../../types/SerializedAnnotationType";
import { Color } from "../../types/Color";
import { SerializedFileType } from "../../types/SerializedFileType";
import {
  generateDefaultChannels,
  importSerializedAnnotations,
  replaceDuplicateName,
} from "../../image/imageHelper";
import * as _ from "lodash";
import { Partition } from "../../types/Partition";
import { AnnotationTool } from "../../annotator/image/Tool";
import { defaultImage } from "images/defaultImage";

const initialCategories =
  process.env.NODE_ENV === "development"
    ? [
        UNKNOWN_ANNOTATION_CATEGORY,
        {
          color: "#b66dff",
          id: "00000000-0000-0000-0000-000000000001",
          name: "Cell membrane",
          visible: true,
        },
        {
          color: "#6db6ff",
          id: "00000000-0000-0000-0000-000000000002",
          name: "Cell nucleus",
          visible: true,
        },
      ]
    : [UNKNOWN_ANNOTATION_CATEGORY];

const initialState: ImageViewer = {
  annotationState: AnnotationStateType.Blank,
  boundingClientRect: new DOMRect(),
  brightness: 0,
  categories: initialCategories,
  currentColors: undefined,
  currentIndex: 0,
  cursor: "default",
  contrast: 0,
  exposure: 0,
  hue: 0,
  activeImageId: defaultImage.id,
  activeImageRenderedSrcs: [defaultImage.src],
  images: [defaultImage],
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
  selectedAnnotation: undefined,
  selectedAnnotations: [],
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
  },
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer-application",
  reducers: {
    addImages(
      state: ImageViewer,
      action: PayloadAction<{ newImages: Array<ShadowImageType> }>
    ) {
      //we look for image name duplicates and append number if such duplicates are found
      const imageNames = state.images.map((image: ShadowImageType) => {
        return image.name.split(".")[0];
      });

      const updatedImages = action.payload.newImages.map(
        (image: ShadowImageType, i: number) => {
          const initialName = image.name.split(".")[0]; //get name before file extension
          //add filename extension to updatedName
          const updatedName =
            replaceDuplicateName(initialName, imageNames) +
            "." +
            image.name.split(".")[1];
          return { ...image, name: updatedName };
        }
      );

      state.images.push(...updatedImages);
    },
    clearCategoryAnnotations(
      state: ImageViewer,
      action: PayloadAction<{ category: Category }>
    ) {
      for (let image of state.images) {
        image.annotations = image.annotations.filter(
          (annotation: AnnotationType) => {
            return annotation.categoryId !== action.payload.category.id;
          }
        );
      }
    },
    deleteCategory(
      state: ImageViewer,
      action: PayloadAction<{ category: Category }>
    ) {
      state.categories = state.categories.filter(
        (category: Category) => category.id !== action.payload.category.id
      );
    },
    deleteImage(state: ImageViewer, action: PayloadAction<{ id: string }>) {
      state.images = state.images.filter(
        (image: ShadowImageType) => image.id !== action.payload.id
      );
    },
    deleteAllInstances(state: ImageViewer) {
      //deletes all instances across all images
      state.images = state.images.map((image: ShadowImageType) => {
        return { ...image, annotations: [] };
      });
    },
    deleteAllImageInstances(
      state: ImageViewer,
      action: PayloadAction<{ imageId: string }>
    ) {
      //deletes all instances across a given image
      state.images = state.images.map((image: ShadowImageType) => {
        if (image.id === action.payload.imageId) {
          return { ...image, annotations: [] };
        } else return image;
      });
    },
    deleteImageInstances(
      //deletes given instance on active image
      state: ImageViewer,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      if (!state.activeImageId) return;

      state.images = state.images.map((image: ShadowImageType) => {
        if (image.id === state.activeImageId) {
          const updatedAnnotations = image.annotations.filter(
            (annotation: AnnotationType) => {
              return !action.payload.ids.includes(annotation.id);
            }
          );
          return { ...image, annotations: updatedAnnotations };
        } else return image;
      });
    },
    openAnnotations(
      state: ImageViewer,
      action: PayloadAction<{ file: SerializedFileType }>
    ) {
      /*
       * NOTE: The correct image to annotate is found by looking at the
       * imageFilename property in the imported annotation file. -- Alice
       */
      if (!state.activeImageId) return;

      const annotations = action.payload.file.annotations.map(
        (annotation: SerializedAnnotationType): AnnotationType => {
          const { annotation_out, categories } = importSerializedAnnotations(
            annotation,
            state.categories
          );
          state.categories = categories;
          return annotation_out;
        }
      );

      const loaded: ShadowImageType = {
        id: action.payload.file.imageId,
        name: action.payload.file.imageFilename,
        annotations: annotations,
        activePlane: 0,
        colors: action.payload.file.imageColors
          ? action.payload.file.imageColors
          : generateDefaultChannels(action.payload.file.imageChannels),
        src: action.payload.file.imageSrc,
        categoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
        originalSrc: action.payload.file.imageData,
        partition: Partition.Inference,
        visible: true,
        shape: {
          channels: action.payload.file.imageChannels,
          frames: action.payload.file.imageFrames,
          height: action.payload.file.imageHeight,
          planes: action.payload.file.imagePlanes,
          width: action.payload.file.imageWidth,
        },
      };

      state.images.push(...[loaded]);
    },
    setActiveImageRenderedSrcs(
      state: ImageViewer,
      action: PayloadAction<{
        renderedSrcs: Array<string>;
      }>
    ) {
      state.activeImageRenderedSrcs = action.payload.renderedSrcs;
    },
    setAnnotationState(
      state: ImageViewer,
      action: PayloadAction<{
        annotationState: AnnotationStateType;
        annotationTool: AnnotationTool | undefined;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },
    setBoundingClientRect(
      state: ImageViewer,
      action: PayloadAction<{ boundingClientRect: DOMRect }>
    ) {
      state.boundingClientRect = action.payload.boundingClientRect;
    },
    setBrightness(
      state: ImageViewer,
      action: PayloadAction<{ brightness: number }>
    ) {
      state.brightness = action.payload.brightness;
    },
    setCategories(
      state: ImageViewer,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = action.payload.categories;
    },
    setCategoryVisibility(
      state: ImageViewer,
      action: PayloadAction<{ category: Category; visible: boolean }>
    ) {
      const category = _.find(state.categories, (category) => {
        return category.id === action.payload.category.id;
      });
      if (!category) return;
      category.visible = action.payload.visible;
      state.categories = [
        ...state.categories.filter((category) => {
          return category.id !== action.payload.category.id;
        }),
        category,
      ];
    },
    setContrast(
      state: ImageViewer,
      action: PayloadAction<{ contrast: number }>
    ) {
      state.contrast = action.payload.contrast;
    },
    setCurrentIndex(
      state: ImageViewer,
      action: PayloadAction<{ currentIndex: number }>
    ) {
      state.currentIndex = action.payload.currentIndex;
    },
    setExposure(
      state: ImageViewer,
      action: PayloadAction<{ exposure: number }>
    ) {
      state.exposure = action.payload.exposure;
    },
    setHue(state: ImageViewer, action: PayloadAction<{ hue: number }>) {
      state.hue = action.payload.hue;
    },
    setActiveImage(
      state: ImageViewer,
      action: PayloadAction<{ imageId: string | undefined }>
    ) {
      state.activeImageId = action.payload.imageId;

      // reset selected annotations
      state.selectedAnnotations = [];
      state.selectedAnnotation = undefined;
    },
    setActiveImagePlane(
      state: ImageViewer,
      action: PayloadAction<{ activeImagePlane: number }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: ShadowImageType) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, activePlane: action.payload.activeImagePlane };
        }
      });
    },
    setImageColors(
      state: ImageViewer,
      action: PayloadAction<{ colors: Array<Color>; ignoreRender?: boolean }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: ShadowImageType) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, colors: action.payload.colors };
        }
      });
    },
    setImageSrc(state: ImageViewer, action: PayloadAction<{ src: string }>) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: ShadowImageType) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, src: action.payload.src };
        }
      });
    },
    setImages(
      state: ImageViewer,
      action: PayloadAction<{ images: Array<ShadowImageType> }>
    ) {
      state.images = action.payload.images;
    },
    setCurrentColors(
      state: ImageViewer,
      action: PayloadAction<{
        currentColors: Array<Color>;
      }>
    ) {
      state.currentColors = action.payload.currentColors;
    },
    setCursor(
      state: ImageViewer,
      action: PayloadAction<{
        cursor: string;
      }>
    ) {
      state.cursor = action.payload.cursor;
    },
    setImageInstances(
      state: ImageViewer,
      action: PayloadAction<{
        instances: Array<AnnotationType>;
        imageId: string;
      }>
    ) {
      //update corresponding image object in array of Images stored in state
      state.images = state.images.map((image: ShadowImageType) => {
        if (action.payload.imageId !== image.id) {
          return image;
        } else {
          return { ...image, annotations: action.payload.instances };
        }
      });
    },
    setLanguage(
      state: ImageViewer,
      action: PayloadAction<{ language: LanguageType }>
    ) {
      state.language = action.payload.language;
    },
    setOffset(
      state: ImageViewer,
      action: PayloadAction<{ offset: { x: number; y: number } }>
    ) {
      state.offset = action.payload.offset;
    },
    setOperation(
      state: ImageViewer,
      action: PayloadAction<{ operation: ToolType }>
    ) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state: ImageViewer,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setPointerSelection(
      state: ImageViewer,
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
    setQuickSelectionBrushSize(
      state: ImageViewer,
      action: PayloadAction<{ quickSelectionBrushSize: number }>
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionBrushSize;
    },
    setThresholdAnnotationValue(
      state: ImageViewer,
      action: PayloadAction<{ thresholdAnnotationValue: number }>
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
    setSaturation(
      state: ImageViewer,
      action: PayloadAction<{ saturation: number }>
    ) {
      state.saturation = action.payload.saturation;
    },
    setSelectedCategoryId(
      state: ImageViewer,
      action: PayloadAction<{ selectedCategoryId: string }>
    ) {
      state.selectedCategoryId = action.payload.selectedCategoryId;
    },
    setSelectedAnnotations(
      state: ImageViewer,
      action: PayloadAction<{
        selectedAnnotations: Array<AnnotationType>;
        selectedAnnotation: AnnotationType | undefined;
      }>
    ) {
      state.selectedAnnotations = action.payload.selectedAnnotations;
      state.selectedAnnotation = action.payload.selectedAnnotation;
    },
    setSelectionMode(
      state: ImageViewer,
      action: PayloadAction<{ selectionMode: AnnotationModeType }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setStageHeight(
      state: ImageViewer,
      action: PayloadAction<{ stageHeight: number }>
    ) {
      state.stageHeight = action.payload.stageHeight;
    },
    setStagePosition(
      state: ImageViewer,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>
    ) {
      state.stagePosition = action.payload.stagePosition;
    },
    setStageScale(
      state: ImageViewer,
      action: PayloadAction<{ stageScale: number }>
    ) {
      state.stageScale = action.payload.stageScale;
    },
    setStageWidth(
      state: ImageViewer,
      action: PayloadAction<{ stageWidth: number }>
    ) {
      state.stageWidth = action.payload.stageWidth;
    },
    setSoundEnabled(
      state: ImageViewer,
      action: PayloadAction<{ soundEnabled: boolean }>
    ) {
      state.soundEnabled = action.payload.soundEnabled;
    },
    setVibrance(
      state: ImageViewer,
      action: PayloadAction<{ vibrance: number }>
    ) {
      state.vibrance = action.payload.vibrance;
    },
    setZoomSelection(
      state: ImageViewer,
      action: PayloadAction<{
        zoomSelection: {
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
        };
      }>
    ) {
      state.zoomSelection = action.payload.zoomSelection;
    },
  },
  extraReducers: {
    "thunks/loadLayersModel/fulfilled": (
      state: ImageViewer,
      action: PayloadAction<tensorflow.LayersModel>
    ) => {
      console.info(action.payload);
    },
  },
});

export const {
  addImages,
  deleteCategory,
  deleteAllInstances,
  deleteImage,
  openAnnotations,
  setActiveImage,
  setActiveImagePlane,
  setAnnotationState,
  setBoundingClientRect,
  setBrightness,
  setCategories,
  setCategoryVisibility,
  setCurrentColors,
  setContrast,
  setCurrentIndex,
  setCursor,
  setExposure,
  setHue,
  setImages,
  setLanguage,
  setOffset,
  setOperation,
  setPenSelectionBrushSize,
  setPointerSelection,
  setQuickSelectionBrushSize,
  setSaturation,
  setSelectedAnnotations,
  setSelectionMode,
  setSelectedCategoryId,
  setSoundEnabled,
  setStageHeight,
  setStagePosition,
  setStageScale,
  setStageWidth,
  setVibrance,
  setZoomSelection,
} = imageViewerSlice.actions;
