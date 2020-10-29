import {
  configureStore,
  createAction,
  createReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { v4 } from "uuid";
import { findIndex } from "underscore";

export enum LossFunction {
  AbsoluteDifference = "Absolute difference",
  CosineDistance = "Cosine distance",
  Hinge = "Hinge",
  Huber = "Huber",
  Log = "Log",
  MeanSquaredError = "Mean squared error (MSE)",
  SigmoidCrossEntropy = "Sigmoid cross-entropy",
  SoftmaxCrossEntropy = "Softmax cross-entropy",
}

export enum OptimizationAlgorithm {
  Adadelta = "Adadelta",
  Adagrad = "Adagrad",
  Adam = "Adam",
  Adamax = "Adamax",
  Momentum = "Momentum",
  RMSProp = "RMSProp",
  StochasticGradientDescent = "Stochastic gradient descent (SGD)",
}

export type Category = {
  color: string;
  id: string;
  name: string;
};

export type Classifier = {
  batchSize: number;
  epochs: number;
  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
};

export type Project = {
  categories: Array<Category>;
  classifier: Classifier;
  name: string;
  images: Array<Image>;
};

export type ProjectState = {
  project: Project;
};

export const fit = (state: ProjectState, action: PayloadAction) => {};

const initialState: ProjectState = {
  project: {
    categories: [
      {
        color: "rgb(255, 255, 0)",
        id: "00000000-0000-0000-0000-000000000000",
        name: "Unknown",
      },
    ],
    classifier: {
      batchSize: 32,
      epochs: 1,
      learningRate: 0.01,
      lossFunction: LossFunction.MeanSquaredError,
      optimizationAlgorithm: OptimizationAlgorithm.Adam,
    },
    images: [],
    name: "Untitled project",
  },
};

export const createCategoryAction = createAction<{ name: string }>(
  "create-category"
);

export const createImageAction = createAction<{ src: string }>("create-image");

export const fitClassifierAction = createAction("fit-classifier");

export const updateCategoryAction = createAction<{
  id: string;
  name: string;
  color: string;
}>("update-category");

export const updateClassifierBatchSizeAction = createAction<{
  batchSize: number;
}>("update-classifier-batch-size");

export const updateClassifierEpochsAction = createAction<{
  epochs: number;
}>("update-classifier-epochs");

export const updateClassifierLearningRateAction = createAction<{
  learningRate: number;
}>("update-classifier-learning-rate");

export const updateClassifierLossFunctionAction = createAction<{
  lossFunction: LossFunction;
}>("update-classifier-loss-function");

export const updateClassifierOptimizationAlgorithmAction = createAction<{
  optimizationAlgorithm: OptimizationAlgorithm;
}>("update-classifier-optimization-algorithm");

export const updateImageCategoryAction = createAction<{
  id: string;
  categoryId: string;
}>("update-image-category");

const reducer = createReducer(initialState, {
  [createCategoryAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ name: string }>
  ) => {
    const category: Category = {
      color: "#00FFFF",
      id: v4().toString(),
      name: action.payload.name,
    };

    state.project.categories.push(category);
  },
  [createImageAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ src: string }>
  ) => {
    const image: Image = {
      id: v4(),
      name: "",
      src: action.payload.src,
      categoryId: "00000000-0000-0000-0000-000000000000",
    };

    state.project.images.push(image);
  },
  [fitClassifierAction.type]: (
    state: ProjectState,
    action: PayloadAction
  ) => {},
  [updateCategoryAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ id: string; name: string; color: string }>
  ) => {
    const index = findIndex(state.project.categories, (category: Category) => {
      return category.id === action.payload.id;
    });
    state.project.categories[index].name = action.payload.name;
    state.project.categories[index].color = action.payload.color;
  },
  [updateClassifierBatchSizeAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ batchSize: number }>
  ) => {
    state.project.classifier.batchSize = action.payload.batchSize;
  },
  [updateClassifierEpochsAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ epochs: number }>
  ) => {
    state.project.classifier.epochs = action.payload.epochs;
  },
  [updateClassifierLearningRateAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ learningRate: number }>
  ) => {
    state.project.classifier.learningRate = action.payload.learningRate;
  },
  [updateClassifierLossFunctionAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ lossFunction: LossFunction }>
  ) => {
    state.project.classifier.lossFunction = action.payload.lossFunction;
  },
  [updateClassifierOptimizationAlgorithmAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
  ) => {
    state.project.classifier.optimizationAlgorithm =
      action.payload.optimizationAlgorithm;
  },
  [updateImageCategoryAction.type]: (
    state: ProjectState,
    action: PayloadAction<{ id: string; categoryId: string }>
  ) => {
    const index = findIndex(state.project.images, (image: Image) => {
      return image.id === action.payload.id;
    });

    if (index >= 0) {
      state.project.images[index].categoryId = action.payload.categoryId;
    }
  },
});

export const store = configureStore({ reducer: reducer });
