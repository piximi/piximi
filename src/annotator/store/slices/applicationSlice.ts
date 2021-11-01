import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "../../../types/Category";
import { ImageViewerImage } from "../../../types/ImageViewerImage";
import { ToolType } from "../../../types/ToolType";
import { AnnotationType } from "../../../types/AnnotationType";
import { AnnotationModeType } from "../../../types/AnnotationModeType";
import * as _ from "lodash";
import colorImage from "../../../images/cell-painting.png";
import { LanguageType } from "../../../types/LanguageType";
import * as tensorflow from "@tensorflow/tfjs";
import { ImageViewer } from "../../../types/ImageViewer";
import { SerializedAnnotationType } from "../../../types/SerializedAnnotationType";
import { ChannelType } from "../../../types/ChannelType";
import { SerializedFileType } from "../../../types/SerializedFileType";
import {
  importSerializedAnnotations,
  replaceDuplicateName,
} from "../../../image/imageHelper";

const initialImage =
  process.env.NODE_ENV === "development"
    ? {
        avatar: colorImage,
        id: "f8eecf66-8776-4e14-acd2-94b44603a1a7",
        annotations: [],
        name: "example.png",
        shape: {
          channels: 3,
          frames: 1,
          height: 512,
          planes: 1,
          width: 512,
        },
        originalSrc: colorImage,
        src: colorImage,
      }
    : undefined;

const initialCategories =
  process.env.NODE_ENV === "development"
    ? [
        {
          color: "#AAAAAA",
          id: "00000000-0000-0000-0000-000000000000",
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
          id: "00000000-0000-0000-0000-000000000000",
          name: "Unknown",
          visible: true,
        },
      ];

const initialState: ImageViewerImage = {
  annotated: false,
  annotating: false,
  boundingClientRect: new DOMRect(),
  brightness: 0,
  categories: initialCategories.length > 0 ? initialCategories : [],
  channels: [
    //R, G, and B channels by default
    {
      range: [0, 255],
      visible: true,
    },
    {
      range: [0, 255],
      visible: true,
    },
    {
      range: [0, 255],
      visible: true,
    },
  ],
  currentIndex: 0,
  cursor: "default",
  contrast: 0,
  exposure: 0,
  hue: 0,
  activeImageId: initialImage ? initialImage.id : undefined,
  images: initialImage ? [initialImage] : [],
  invertMode: false,
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
  selectedCategory: "00000000-0000-0000-0000-000000000000",
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

export const applicationSlice = createSlice({
  initialState: initialState,
  name: "image-viewer-application",
  reducers: {
    addImages(
      state: ImageViewerImage,
      action: PayloadAction<{ newImages: Array<ImageViewerImage> }>
    ) {
      //we look for image name duplicates and append number if such duplicates are found
      const imageNames = state.images.map((image: ImageViewerImage) => {
        return image.name.split(".")[0];
      });
      const updatedImages = action.payload.newImages.map(
        (image: ImageViewerImage) => {
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
      state: ImageViewerImage,
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
      state: ImageViewerImage,
      action: PayloadAction<{ category: Category }>
    ) {
      state.categories = state.categories.filter(
        (category: Category) => category.id !== action.payload.category.id
      );
    },
    deleteImage(
      state: ImageViewerImage,
      action: PayloadAction<{ id: string }>
    ) {
      state.images = state.images.filter(
        (image: ImageViewerImage) => image.id !== action.payload.id
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
      state: ImageViewerImage,
      action: PayloadAction<{ id: string }>
    ) {
      //deletes all instances across all images
      state.images = state.images.map((image: ImageViewerImage) => {
        return { ...image, annotations: [] };
      });
    },
    deleteAllImageInstances(
      state: ImageViewerImage,
      action: PayloadAction<{ imageId: string }>
    ) {
      //deletes all instances across a given image
      state.images = state.images.map((image: ImageViewerImage) => {
        if (image.id === action.payload.imageId) {
          return { ...image, annotations: [] };
        } else return image;
      });
    },
    deleteImageInstances(
      //deletes given instance on active image
      state: ImageViewerImage,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      if (!state.activeImageId) return;

      state.images = state.images.map((image: ImageViewerImage) => {
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
      state: ImageViewerImage,
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

      const loaded: ImageViewerImage = {
        avatar: action.payload.file.imageData,
        id: action.payload.file.imageId,
        src: action.payload.file.imageData,
        originalSrc: action.payload.file.imageData,
        name: action.payload.file.imageFilename,
        annotations: annotations,
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
    setAnnotated(
      state: ImageViewerImage,
      action: PayloadAction<{ annotated: boolean }>
    ) {
      state.annotated = action.payload.annotated;
    },
    setAnnotating(
      state: ImageViewerImage,
      action: PayloadAction<{ annotating: boolean }>
    ) {
      state.annotating = action.payload.annotating;
    },
    setBoundingClientRect(
      state: ImageViewerImage,
      action: PayloadAction<{ boundingClientRect: DOMRect }>
    ) {
      state.boundingClientRect = action.payload.boundingClientRect;
    },
    setBrightness(
      state: ImageViewerImage,
      action: PayloadAction<{ brightness: number }>
    ) {
      state.brightness = action.payload.brightness;
    },
    setCategories(
      state: ImageViewerImage,
      action: PayloadAction<{ categories: Array<Category> }>
    ) {
      state.categories = action.payload.categories;
    },
    setCategoryVisibility(
      state: ImageViewerImage,
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
      state: ImageViewerImage,
      action: PayloadAction<{ contrast: number }>
    ) {
      state.contrast = action.payload.contrast;
    },
    setCurrentIndex(
      state: ImageViewerImage,
      action: PayloadAction<{ currentIndex: number }>
    ) {
      state.currentIndex = action.payload.currentIndex;
    },
    setExposure(
      state: ImageViewerImage,
      action: PayloadAction<{ exposure: number }>
    ) {
      state.exposure = action.payload.exposure;
    },
    setHue(state: ImageViewerImage, action: PayloadAction<{ hue: number }>) {
      state.hue = action.payload.hue;
    },
    setActiveImage(
      state: ImageViewerImage,
      action: PayloadAction<{ image: string }>
    ) {
      state.activeImageId = action.payload.image;
      const activeImage = state.images.find((image: ImageViewerImage) => {
        return image.id === action.payload.image;
      });
      if (!activeImage) return;
      const defaultChannels: Array<ChannelType> = []; //number of channels depends on whether image is greyscale or RGB
      for (let i = 0; i < activeImage.shape.channels; i++) {
        defaultChannels.push({
          range: [0, 255],
          visible: true,
        });
      }
      state.channels = defaultChannels;
    },
    setImageInstances(
      state: ImageViewerImage,
      action: PayloadAction<{ instances: Array<AnnotationType> }>
    ) {
      if (!state.activeImageId) return;

      //update corresponding image object in array of Images stored in state
      state.images = state.images.map((image: ImageViewerImage) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, annotations: action.payload.instances };
        }
      });
    },
    setImageSrc(
      state: ImageViewerImage,
      action: PayloadAction<{ src: string }>
    ) {
      if (!state.activeImageId) return;
      state.images = state.images.map((image: ImageViewerImage) => {
        if (state.activeImageId !== image.id) {
          return image;
        } else {
          return { ...image, src: action.payload.src };
        }
      });
    },
    setImages(
      state: ImageViewerImage,
      action: PayloadAction<{ images: Array<ImageViewerImage> }>
    ) {
      state.images = action.payload.images;
    },
    setChannels(
      state: ImageViewerImage,
      action: PayloadAction<{
        channels: Array<ChannelType>;
      }>
    ) {
      state.channels = action.payload.channels;
    },
    setCursor(
      state: ImageViewerImage,
      action: PayloadAction<{
        cursor: string;
      }>
    ) {
      state.cursor = action.payload.cursor;
    },
    setInvertMode(
      state: ImageViewerImage,
      action: PayloadAction<{ invertMode: boolean }>
    ) {
      state.invertMode = action.payload.invertMode;
    },
    setLanguage(
      state: ImageViewerImage,
      action: PayloadAction<{ language: LanguageType }>
    ) {
      state.language = action.payload.language;
    },
    setOffset(
      state: ImageViewerImage,
      action: PayloadAction<{ offset: { x: number; y: number } }>
    ) {
      state.offset = action.payload.offset;
    },
    setOperation(
      state: ImageViewerImage,
      action: PayloadAction<{ operation: ToolType }>
    ) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state: ImageViewerImage,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setPointerSelection(
      state: ImageViewerImage,
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
      state: ImageViewerImage,
      action: PayloadAction<{ quickSelectionBrushSize: number }>
    ) {
      state.quickSelectionBrushSize = action.payload.quickSelectionBrushSize;
    },
    setSaturation(
      state: ImageViewerImage,
      action: PayloadAction<{ saturation: number }>
    ) {
      state.saturation = action.payload.saturation;
    },
    setSelectedCategory(
      state: ImageViewerImage,
      action: PayloadAction<{ selectedCategory: string }>
    ) {
      state.selectedCategory = action.payload.selectedCategory;
    },
    setSelectedAnnotations(
      state: ImageViewerImage,
      action: PayloadAction<{
        selectedAnnotations: Array<AnnotationType>;
        selectedAnnotation: AnnotationType | undefined;
      }>
    ) {
      state.selectedAnnotations = action.payload.selectedAnnotations;
      state.selectedAnnotation = action.payload.selectedAnnotation;
    },
    setSelectionMode(
      state: ImageViewerImage,
      action: PayloadAction<{ selectionMode: AnnotationModeType }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setStageHeight(
      state: ImageViewerImage,
      action: PayloadAction<{ stageHeight: number }>
    ) {
      state.stageHeight = action.payload.stageHeight;
    },
    setStagePosition(
      state: ImageViewerImage,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>
    ) {
      state.stagePosition = action.payload.stagePosition;
    },
    setStageScale(
      state: ImageViewerImage,
      action: PayloadAction<{ stageScale: number }>
    ) {
      state.stageScale = action.payload.stageScale;
    },
    setStageWidth(
      state: ImageViewerImage,
      action: PayloadAction<{ stageWidth: number }>
    ) {
      state.stageWidth = action.payload.stageWidth;
    },
    setSoundEnabled(
      state: ImageViewerImage,
      action: PayloadAction<{ soundEnabled: boolean }>
    ) {
      state.soundEnabled = action.payload.soundEnabled;
    },
    setVibrance(
      state: ImageViewerImage,
      action: PayloadAction<{ vibrance: number }>
    ) {
      state.vibrance = action.payload.vibrance;
    },
    setZoomSelection(
      state: ImageViewerImage,
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
      state: ImageViewerImage,
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
  deleteAllImageInstances,
  setActiveImage,
  setAnnotating,
  setAnnotated,
  setBoundingClientRect,
  setBrightness,
  setCategories,
  setCategoryVisibility,
  setChannels,
  setContrast,
  setCurrentIndex,
  setCursor,
  setExposure,
  setHue,
  setImageInstances,
  setImages,
  setInvertMode,
  setLanguage,
  setOffset,
  setOperation,
  setPenSelectionBrushSize,
  setPointerSelection,
  setQuickSelectionBrushSize,
  setSaturation,
  setSelectedAnnotations,
  setSelectionMode,
  setSelectedCategory,
  setSoundEnabled,
  setStageHeight,
  setStagePosition,
  setStageScale,
  setStageWidth,
  setVibrance,
  setZoomSelection,
} = applicationSlice.actions;
