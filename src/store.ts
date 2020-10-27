import {
  configureStore,
  createAction,
  createReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { v4 } from "uuid";
import { findIndex } from "underscore";
import * as tensorflow from "@tensorflow/tfjs";
import { create } from "domain";

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

function lookupValue(inputEnum: any, value: string) {
  let keys = Object.keys(inputEnum).filter((x) => inputEnum[x] === value);
  return keys[0];
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

export type State = {
  predictions?: any;
  project: Project;
};

export const fit = (state: State, action: PayloadAction) => {
  // Define a model for linear regression.
  const modelUrl =
    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_035_224/classification/3/default/1";

  const model = tensorflow
    .loadGraphModel(modelUrl, { fromTFHub: true })
    .then((graph) => {
      console.log(graph);
    });

  // Prepare the model for training: Specify the loss and the optimizer.

  console.log("Setting up params");
  console.log(
    lookupValue(LossFunction, state.project.classifier.lossFunction) as string
  );
  console.log(
    lookupValue(
      OptimizationAlgorithm,
      state.project.classifier.optimizationAlgorithm
    ) as string
  );

  // model.compile({
  //   loss: lookupValue(LossFunction, state.project.classifier.lossFunction) as string,
  //   optimizer: lookupValue(OptimizationAlgorithm, state.project.classifier.optimizationAlgorithm) as string,
  // });
  //
  // // Generate some synthetic data for training.
  // const xs = tensorflow.randomNormal([32, 224, 224, 3]);
  // const ys = tensorflow.oneHot(tensorflow.randomUniform([32, 1], 0, 2, "int32"), 3);
  //
  // // Train the model using the data.
  // const predictions = model.fit(xs, ys).then(() => {
  //   // Use the model to do inference on a data point the model hasn't seen before:
  //   model.predict(tensorflow.randomNormal([1, 224, 224, 3]));
  //   console.log("I made a classifier and trained it");
  // });
  // state.predictions = predictions;
};

const initialState: State = {
  project: {
    categories: [
      {
        color: "rgb(0, 255, 255)",
        id: "91fdbc1f-b654-4150-9fe3-53d28c4287c4",
        name: "Cell membrane",
      },
      {
        color: "rgb(255, 0, 255)",
        id: "8039cf80-6ad6-4c57-8001-871765905c5b",
        name: "Nucleus",
      },
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
    images: [
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "6aab03f4-eae5-4eb4-82a0-236068a07c56",
        name: "foo",
        src: "https://picsum.photos/seed/1/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "1103d28a-ac3d-4980-af54-7d8375dbf791",
        name: "foo",
        src: "https://picsum.photos/seed/2/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "ca874261-0300-414d-95d7-7ceb2e5de52f",
        name: "foo",
        src: "https://picsum.photos/seed/3/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "c9a26b6b-1226-4e54-9f9e-d3e710cd7308",
        name: "foo",
        src: "https://picsum.photos/seed/4/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "589a5fc5-a01a-4346-8a70-1f89f0abcb95",
        name: "foo",
        src: "https://picsum.photos/seed/5/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "6593fa38-bb6b-46d7-92d2-98a80c695312",
        name: "foo",
        src: "https://picsum.photos/seed/6/512/512",
      },
    ],
    name: "Untitled project",
  },
};

export const createCategoryAction = createAction<{ name: string }>(
  "create-category"
);

export const deleteCategoryAction = createAction<{ id: string }>(
  "delete-category"
);

export const fitClassifierAction = createAction("fit-classifier");

export const updateCategoryAction = createAction<{
  id: string;
  name: string;
  color: string;
}>("update-category");

export const updateCategoryNameAction = createAction<{
  id: string;
  name: string;
}>("update-category-name");

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
    state: State,
    action: PayloadAction<{ name: string }>
  ) => {
    const category: Category = {
      color: "#00FFFF",
      id: v4().toString(),
      name: action.payload.name,
    };

    state.project.categories.push(category);
  },
  [fitClassifierAction.type]: (state: State, action: PayloadAction) => {
    fit(state, action);
  },
  [updateCategoryAction.type]: (
    state: State,
    action: PayloadAction<{ id: string; name: string; color: string }>
  ) => {
    const index = findIndex(state.project.categories, (category: Category) => {
      return category.id === action.payload.id;
    });
    state.project.categories[index].name = action.payload.name;
    state.project.categories[index].color = action.payload.color;
  },
  [updateClassifierBatchSizeAction.type]: (
    state: State,
    action: PayloadAction<{ batchSize: number }>
  ) => {
    state.project.classifier.batchSize = action.payload.batchSize;
  },
  [updateClassifierEpochsAction.type]: (
    state: State,
    action: PayloadAction<{ epochs: number }>
  ) => {
    state.project.classifier.epochs = action.payload.epochs;
  },
  [updateClassifierLearningRateAction.type]: (
    state: State,
    action: PayloadAction<{ learningRate: number }>
  ) => {
    state.project.classifier.learningRate = action.payload.learningRate;
  },
  [updateClassifierLossFunctionAction.type]: (
    state: State,
    action: PayloadAction<{ lossFunction: LossFunction }>
  ) => {
    state.project.classifier.lossFunction = action.payload.lossFunction;
  },
  [updateClassifierOptimizationAlgorithmAction.type]: (
    state: State,
    action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
  ) => {
    state.project.classifier.optimizationAlgorithm =
      action.payload.optimizationAlgorithm;
  },
  [updateImageCategoryAction.type]: (
    state: State,
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
