import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Image } from "../../types/Image";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { ToolType } from "../../types/ToolType";
import { AnnotationType } from "../../types/AnnotationType";
import { AnnotationModeType } from "../../types/AnnotationModeType";
import { AnnotationStateType } from "../../types/AnnotationStateType";
import colorImage from "../../images/cell-painting.png";
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
import { Shape } from "../../types/Shape";
import * as cellpaintingAnnotations from "../../images/cellpainting.json";

const initialImageShape: Shape = {
  channels: 3,
  frames: 1,
  height: 512,
  planes: 1,
  width: 512,
};

const initialImage: Image | undefined =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
    ? {
        activeSlice: 0,
        categoryId: UNKNOWN_CATEGORY_ID,
        colors: generateDefaultChannels(3),
        id: "f8eecf66-8776-4e14-acd2-94b44603a1a7",
        annotations: [],
        name: "example.png",
        partition: Partition.Inference,
        visible: true,
        shape: initialImageShape,
        originalSrc: (cellpaintingAnnotations as any).default[0].imageData,
        src: colorImage,
      }
    : undefined;

const initialCategories =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
    ? [
        {
          color: "#AAAAAA",
          id: UNKNOWN_CATEGORY_ID,
          name: "Unknown",
          visible: true,
        },
        {
          color: "#a08cd2",
          id: "00000000-0000-0000-0000-000000000001",
          name: "Cell membrane",
          visible: true,
        },
        {
          color: "#b8ddf3",
          id: "00000000-0000-0000-0000-000000000002",
          name: "Cell nucleus",
          visible: true,
        },
      ]
    : [
        {
          color: "#AAAAAA",
          id: UNKNOWN_CATEGORY_ID,
          name: "Unknown",
          visible: true,
        },
      ];

const initialState: ImageViewer = {
  annotationState: AnnotationStateType.Blank,
  boundingClientRect: new DOMRect(),
  brightness: 0,
  categories: initialCategories.length > 0 ? initialCategories : [],
  currentColors: undefined,
  currentIndex: 0,
  cursor: "default",
  contrast: 0,
  exposure: 0,
  hue: 0,
  activeImageId: initialImage ? initialImage.id : undefined,
  images: initialImage ? [initialImage] : [],
  language: LanguageType.English,
  offset: { x: 0, y: 0 },
  penSelectionBrushSize: 32,
  pointerSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
  },
  quickSelectionBrushSize: 40,
  saturation: 0,
  selectedAnnotation: undefined,
  selectedAnnotations: [],
  selectedCategoryId: UNKNOWN_CATEGORY_ID,
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
      action: PayloadAction<{ newImages: Array<Image> }>
    ) {
      //we look for image name duplicates and append number if such duplicates are found
      const imageNames = state.images.map((image: Image) => {
        return image.name.split(".")[0];
      });

      const updatedImages = action.payload.newImages.map(
        (image: Image, i: number) => {
          const initialName = image.name.split(".")[0]; //get name before file extension
          //add filename extension to updatedName
          const updatedName =
            replaceDuplicateName(initialName, imageNames) +
            "." +
            image.name.split(".")[1];
          return { ...image, name: updatedName };
        }
      );

      state.selectedAnnotations = [];

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
        (image: Image) => image.id !== action.payload.id
      );
      if (!state.images.length) state.activeImageId = undefined;
      else if (
        state.activeImageId === action.payload.id &&
        state.images.length
      ) {
        state.activeImageId = state.images[0].id;
      }
    },
    deleteAllInstances(
      state: ImageViewer,
      action: PayloadAction<{ id: string }>
    ) {
      //deletes all instances across all images
      state.images = state.images.map((image: Image) => {
        return { ...image, annotations: [] };
      });
    },
    deleteAllImageInstances(
      state: ImageViewer,
      action: PayloadAction<{ imageId: string }>
    ) {
      //deletes all instances across a given image
      state.images = state.images.map((image: Image) => {
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

      state.images = state.images.map((image: Image) => {
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

      const loaded: Image = {
        activeSlice: 0,
        categoryId: UNKNOWN_CATEGORY_ID,
        colors: action.payload.file.imageColors
          ? action.payload.file.imageColors
          : generateDefaultChannels(action.payload.file.imageChannels),
        id: action.payload.file.imageId,
        src: action.payload.file.imageSrc,
        originalSrc: action.payload.file.imageData,
        name: action.payload.file.imageFilename,
        annotations: annotations,
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
      action: PayloadAction<{ image: string }>
    ) {
      state.activeImageId = action.payload.image;
    },
    setActiveImagePlane(
      state: ImageViewer,
      action: PayloadAction<{ activeImagePlane: number }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: Image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, activeSlice: action.payload.activeImagePlane };
        }
      });
    },
    setImageColors(
      state: ImageViewer,
      action: PayloadAction<{ colors: Array<Color> }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: Image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, colors: action.payload.colors };
        }
      });
    },
    setImageSrc(state: ImageViewer, action: PayloadAction<{ src: string }>) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: Image) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, src: action.payload.src };
        }
      });
    },
    setImages(
      state: ImageViewer,
      action: PayloadAction<{ images: Array<Image> }>
    ) {
      state.images = action.payload.images;
      // if (!action.payload.images.length) return;
      // state.activeImageId = action.payload.images[0].id;
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
      state.images = state.images.map((image: Image) => {
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
      state.quickSelectionBrushSize = action.payload.quickSelectionBrushSize;
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
