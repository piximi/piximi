export {
  applicationSlice,
  updateTileSize,
  selectImage,
  deselectImage,
  deselectImages,
  clearSelectedImages,
} from "./applicationSlice";

export {
  classifierSlice,
  compile,
  fit,
  open,
  preprocess,
  updateBatchSize,
  openMnistClassifier,
  updateCompiled,
  updateEpochs,
  updateFitted,
  updateLearningRate,
  updateLossFunction,
  updateMetrics,
  updateOpened,
  updateOptimizationAlgorithm,
  updatePreprocessed,
  updateTrainingPercentage,
  updateTestPercentage,
} from "./classifierSlice";

export {
  imageViewerSlice,
  setImageViewerImage,
  setImageViewerOperation,
  setImageViewerSelectionMode,
} from "./imageViewerSlice";

export {
  createProject,
  createCategory,
  createImage,
  deleteCategory,
  projectSlice,
  updateCategory,
  updateCategoryVisibility,
  updateImageCategory,
  updateImageCategories,
  updateOtherCategoryVisibility,
} from "./projectSlice";
