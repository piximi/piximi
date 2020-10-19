import {
  configureStore,
  createAction,
  createReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { v4 } from "uuid";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import React from "react";

export enum LossFunction {
  AD = "Absolute Difference",
  MSE = "Mean Squared Error (MSE)",
}

export enum OptimizationAlgorithm {
  Adadelta = "Adadelta",
  Adam = "Adam",
  Adamax = "Adamax",
  RMSProp = "RMSProp",
  SGD = "SGD",
}

export type Category = {
  color: string;
  id: string;
  name: string;
};

export type Classifier = {
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
  project: Project;
};

const initialState: State = {
  project: {
    categories: [
      {
        color: "",
        id: "91fdbc1f-b654-4150-9fe3-53d28c4287c4",
        name: "Cell membrane",
      },
      {
        color: "",
        id: "8039cf80-6ad6-4c57-8001-871765905c5b",
        name: "Nucleus",
      },
      {
        color: "",
        id: "00000000-0000-0000-0000-000000000000",
        name: "Unknown",
      },
    ],
    classifier: {
      learningRate: 0.01,
      lossFunction: LossFunction.MSE,
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

export const updateCategoryNameAction = createAction<{
  id: string;
  name: string;
}>("update-category-name");

export const updateClassifierLearningRateAction = createAction<{
  learningRate: number;
}>("update-classifier-learning-rate");

export const updateClassifierLossFunctionAction = createAction<{
  lossFunction: LossFunction;
}>("update-classifier-loss-function");

export const updateClassifierOptimizationAlgorithmAction = createAction<{
  optimizationAlgorithm: OptimizationAlgorithm;
}>("update-classifier-optimization-algorithm");

export const updatePhotoCategoryAction = createAction<{
  id: string;
  categoryId: string;
}>("update-photo-category");

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
});

export const store = configureStore({ reducer: reducer });
