import { createAction } from "@reduxjs/toolkit";
import { History, LayersModel, Scalar, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import {
  Category,
  Classifier,
  CompileOptions,
  FitOptions,
  Image,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Project,
} from "../../store";

export const compileAction = createAction<{
  opened: LayersModel;
  options: CompileOptions;
}>("CLASSIFIER_COMPILE");

export const compiledAction = createAction<{ compiled: LayersModel }>(
  "CLASSIFIER_COMPILED"
);

export const createCategoryAction = createAction<{
  name: string;
  color: string;
}>("PROJECT_CREATE_CATEGORY");

export const createImageAction = createAction<{ src: string }>(
  "PROJECT_CREATE_IMAGE"
);

export const createImagesAction = createAction<{ images: Array<Image> }>(
  "PROJECT_CREATE_IMAGES"
);

export const createProjectAction = createAction<{ project: Project }>(
  "PROJECT_CREATE_PROJECT"
);

export const deleteCategoryAction = createAction<{ category: Category }>(
  "PROJECT_DELETE_CATEGORY"
);

export const deleteImageAction = createAction<{ image: Image }>(
  "PROJECT_DELETE_IMAGE"
);

export const evaluateAction = createAction<{
  fitted: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_EVALUATE");

export const evaluatedAction = createAction<{
  evaluations: Scalar | Array<Scalar>;
}>("CLASSIFIER_EVALUATED");

export const fitAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
  options: FitOptions;
  callback?: any;
}>("CLASSIFIER_FIT");

export const fittedAction = createAction<{
  fitted: LayersModel;
  status: History;
}>("CLASSIFIER_FITTED");

export const generateAction = createAction<{}>("CLASSIFIER_GENERATE");

export const generatedAction = createAction<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_GENERATED");

export const openAction = createAction<{
  pathname: string;
  classes: number;
  units: number;
}>("CLASSIFIER_OPEN");

export const openClassifierAction = createAction<{ classifier: Classifier }>(
  "OPEN_PROJECT_CLASSIFIER"
);

export const openProjectAction = createAction<{ project: Project }>(
  "PROJECT_OPEN_PROJECT"
);

export const openedAction = createAction<{ opened: LayersModel }>(
  "CLASSIFIER_OPENED"
);

export const predictAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_PREDICT");

export const predictedAction = createAction<{ predictions: Tensor }>(
  "CLASSIFIER_PREDICTED"
);

export const saveAction = createAction<{}>("CLASSIFIER_SAVE");

export const savedAction = createAction<{}>("CLASSIFIER_SAVED");

export const toggleCategoryVisibilityAction = createAction<{
  category: Category;
}>("PROJECT_TOGGLE_CATEGORY_VISIBILITY");

export const updateBatchSizeAction = createAction<{ batchSize: number }>(
  "CLASSIFIER_UPDATE_BATCH_SIZE"
);

export const updateCategoryAction = createAction<{
  id: string;
  name: string;
  color: string;
}>("update-category");

export const updateCategoryColorAction = createAction<{
  category: Category;
  color: string;
}>("PROJECT_UPDATE_CATEGORY_COLOR");

export const updateCategoryDescriptionAction = createAction<{
  category: Category;
  description: string;
}>("PROJECT_UPDATE_CATEGORY_DESCRIPTION");

export const updateCategoryVisibilityAction = createAction<{
  category: Category;
  visible: boolean;
}>("PROJECT_UPDATE_CATEGORY_VISIBILITY");

export const updateEpochsAction = createAction<{ epochs: number }>(
  "CLASSIFIER_UPDATE_EPOCHS"
);

export const updateImageBrightnessAction = createAction<{
  image: Image;
  brightness: number;
}>("PROJECT_UPDATE_IMAGE_BRIGHTNESS");

export const updateImageCategoryAction = createAction<{
  id: string;
  categoryId: string;
}>("update-image-category");

export const updateImageContrastAction = createAction<{
  image: Image;
  contrast: number;
}>("PROJECT_UPDATE_IMAGE_CONTRAST");

export const updateImagesCategoryAction = createAction<{
  images: Array<Image>;
  category: Category;
}>("PROJECT_UPDATE_IMAGES_CATEGORY");

export const updateImagesPartitionsAction = createAction<{
  trainingPercentage: Number;
  validationPercentage: Number;
}>("PROJECT_UPDATE_IMAGES_PARTITIONS");

export const updateImagesVisibilityAction = createAction<{
  images: Array<Image>;
  visible: boolean;
}>("PROJECT_UPDATE_IMAGES_VISIBILITY");

export const updateLearningRateAction = createAction<{ learningRate: number }>(
  "CLASSIFIER_UPDATE_LEARNING_RATE"
);

export const updateLossFunctionAction = createAction<{
  lossFunction: LossFunction;
}>("CLASSIFIER_UPDATE_LOSS_FUNCTION");

export const updateLossHistoryAction = createAction<{
  batch: number;
  loss: number;
}>("CLASSIFIER_UPDATE_LOSS_HISTORY");

export const updateMetricsAction = createAction<{ metrics: Array<Metric> }>(
  "CLASSIFIER_UPDATE_METRICS"
);

export const updateOptimizationAlgorithmAction = createAction<{
  optimizationAlgorithm: OptimizationAlgorithm;
}>("CLASSIFIER_UPDATE_OPTIMIZATION_ALGORITHM");

export const updateProjectNameAction = createAction<{ name: string }>(
  "PROJECT_UPDATE_NAME"
);

export const updateTrainingPercentageAction = createAction<{
  trainingPercentage: number;
}>("CLASSIFIER_UPDATE_TRAINING_PERCENTAGE");

export const updateValidationLossHistoryAction = createAction<{
  batch: number;
  loss: number;
}>("CLASSIFIER_UPDATE_VALIDATION_LOSS_HISTORY");

export const updateValidationPercentageAction = createAction<{
  validationPercentage: number;
}>("CLASSIFIER_UPDATE_VALIDATION_PERCENTAGE");
