import { createAction } from "@reduxjs/toolkit";
import { History, LayersModel, Scalar, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import { Category } from "../../types/Category";
import { Classifier } from "../../types/Classifier";
import { CompileOptions } from "../../types/CompileOptions";
import { FitOptions } from "../../types/FitOptions";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const compileModelAction = createAction<{
  opened: LayersModel;
  options: CompileOptions;
}>("CLASSIFIER_COMPILE");

export const compiledModelAction = createAction<{ compiled: LayersModel }>(
  "CLASSIFIER_COMPILED"
);

export const createProjectCategoryAction = createAction<{
  name: string;
  color: string;
}>("PROJECT_CREATE_CATEGORY");

export const createProjectImageAction = createAction<{ src: string }>(
  "PROJECT_CREATE_IMAGE"
);

export const createProjectImagesAction = createAction<{ images: Array<Image> }>(
  "PROJECT_CREATE_IMAGES"
);

export const createProjectAction = createAction<{ project: Project }>(
  "PROJECT_CREATE_PROJECT"
);

export const deleteProjectCategoryAction = createAction<{ category: Category }>(
  "PROJECT_DELETE_CATEGORY"
);

export const deleteProjectImageAction = createAction<{ image: Image }>(
  "PROJECT_DELETE_IMAGE"
);

export const fitModelAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
  options: FitOptions;
  callback?: any;
}>("CLASSIFIER_FIT");

export const fittedModelAction = createAction<{
  fitted: LayersModel;
  status: History;
}>("CLASSIFIER_FITTED");

export const preprocessModelAction = createAction<{}>("CLASSIFIER_GENERATE");

export const preprocessedModelAction = createAction<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_GENERATED");

export const openModelAction = createAction<{
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

export const openedModelAction = createAction<{ opened: LayersModel }>(
  "CLASSIFIER_OPENED"
);

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
