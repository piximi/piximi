import * as tensorflow from "@tensorflow/tfjs";
import { History, LayersModel, Scalar, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import * as ImageJS from "image-js";
import {
  configureStore,
  createReducer,
  EnhancedStore,
  Middleware,
  PayloadAction,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import { all, fork, put, select, takeEvery } from "redux-saga/effects";
import createSagaMiddleware from "redux-saga";
import logger from "redux-logger";
import { v4 } from "uuid";
import { findIndex } from "underscore";
import { combineReducers } from "redux";
import {
  compileAction,
  compiledAction,
  createCategoryAction,
  createImageAction,
  createProjectAction,
  evaluateAction,
  evaluatedAction,
  fitAction,
  fittedAction,
  generateAction,
  generatedAction,
  openAction,
  openedAction,
  predictAction,
  predictedAction,
  saveAction,
  savedAction,
  updateBatchSizeAction,
  updateCategoryAction,
  updateEpochsAction,
  updateImageCategoryAction,
  updateImagesPartitionsAction,
  updateLearningRateAction,
  updateLossFunctionAction,
  updateLossHistoryAction,
  updateMetricsAction,
  updateOptimizationAlgorithmAction,
  updateTrainingPercentageAction,
  updateValidationLossHistoryAction,
  updateValidationPercentageAction,
} from "./store/actions";
import {
  categoriesSelector,
  categorizedImagesSelector,
  compiledSelector,
  dataSelector,
  fitOptionsSelector,
  openedSelector,
  trainingPercentageSelector,
  validationDataSelector,
  validationPercentageSelector,
} from "./store/selectors";

export const COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
];

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

export enum Metric {
  BinaryAccuracy = "Binary accuracy",
  BinaryCrossEntropy = "Binary cros-sentropy",
  CategoricalAccuracy = "Categorical accuracy",
  CategoricalCrossentropy = "Categorical cross-entropy",
  CosineProximity = "Cosine proximity",
  MeanAbsoluteError = "Mean absolute error (MAE)",
  MeanAbsolutePercentageError = "Mean absolute percentage error",
  MeanSquaredError = "Mean squared error",
  Precision = "Precision",
  Recall = "Recall",
  SparseCategoricalAccuracy = "Sparse categorical accuracy",
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
  compiled?: LayersModel;
  compiling: boolean;
  data?: Dataset<{ xs: Tensor; ys: Tensor }>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  generating: boolean;
  history?: History;
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  lossHistory?: Array<{ x: number; y: number }>;
  metrics: Array<Metric>;
  model?: LayersModel;
  opened?: LayersModel;
  opening: boolean;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  saving: boolean;
  trainingPercentage: number;
  validationData?: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationLossHistory?: Array<{ x: number; y: number }>;
  validationPercentage: number;
};

export type CompileOptions = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type FitOptions = {
  epochs: number;
  batchSize: number;
  initialEpoch: number;
};

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
};

export type Project = {
  categories: Array<Category>;
  name: string;
  images: Array<Image>;
};

export const compile = (
  opened: tensorflow.LayersModel,
  options: CompileOptions
) => {
  const compiled = opened;

  const loss = () => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return "absoluteDifference";
      }
      case LossFunction.CosineDistance: {
        return "cosineDistance";
      }
      case LossFunction.Hinge: {
        return "hingeLoss";
      }
      case LossFunction.Huber: {
        return "huberLoss";
      }
      case LossFunction.Log: {
        return "logLoss";
      }
      case LossFunction.MeanSquaredError: {
        return "meanSquaredError";
      }
      case LossFunction.SigmoidCrossEntropy: {
        return "sigmoidCrossEntropy";
      }
      case LossFunction.SoftmaxCrossEntropy: {
        return "softmaxCrossEntropy";
      }
      default: {
        return "softmaxCrossEntropy";
      }
    }
  };

  const optimizer = (): tensorflow.Optimizer => {
    switch (options.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return tensorflow.train.adadelta(options.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return tensorflow.train.adagrad(options.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return tensorflow.train.adam(options.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return tensorflow.train.adamax(options.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return tensorflow.train.rmsprop(options.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return tensorflow.train.sgd(options.learningRate);
      }
      default: {
        return tensorflow.train.sgd(options.learningRate);
      }
    }
  };

  compiled.compile({
    optimizer: optimizer(),
    metrics: options.metrics,
    loss: loss(),
  });

  return compiled;
};

export const fit = async (
  compiled: LayersModel,
  data: Dataset<{ xs: Tensor; ys: Tensor }>,
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>,
  options: FitOptions,
  callback?: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    callbacks: {
      onBatchEnd: callback,
    },
    epochs: options.epochs,
    validationData: validationData.batch(options.batchSize),
  };

  const status = await compiled.fitDataset(data.batch(options.batchSize), args);

  return { fitted: compiled, status: status };
};

export const open = async (
  modelUrl: string,
  classes: number,
  units: number
): Promise<tensorflow.LayersModel> => {
  const backbone = await tensorflow.loadLayersModel(modelUrl);

  const truncated = tensorflow.model({
    inputs: backbone.inputs,
    outputs: backbone.getLayer("conv_pw_13_relu").output,
  });

  const a = tensorflow.layers.flatten({
    inputShape: truncated.outputs[0].shape.slice(1),
  });

  const b = tensorflow.layers.dense({
    units: units,
    activation: "relu",
    kernelInitializer: "varianceScaling",
    useBias: true,
  });

  const softmax = tensorflow.layers.dense({
    units: classes,
    kernelInitializer: "varianceScaling",
    useBias: false,
    activation: "softmax",
  });

  const config = {
    layers: [...truncated.layers, a, b, softmax],
  };

  return tensorflow.sequential(config);
};

export const encodeCategory = (categories: number) => {
  return (item: {
    xs: string;
    ys: number;
  }): { xs: string; ys: tensorflow.Tensor } => {
    return { ...item, ys: tensorflow.oneHot(item.ys, categories) };
  };
};

export const encodeImage = async (item: {
  xs: string;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const fetched = await tensorflow.util.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  const data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  const xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: xs });
  });
};

export const resize = async (item: {
  xs: any;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(item.xs, [224, 224]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const generator = (
  images: Array<Image>,
  categories: Array<Category>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const ys = categories
        .filter((category: Category) => {
          return category.id !== "00000000--0000-0000-00000000000";
        })
        .findIndex((category: Category) => {
          return category.id === image.categoryId;
        });

      yield {
        xs: image.src,
        ys: ys,
      };

      index++;
    }
  };
};

export const generate = async (
  images: Array<Image>,
  categories: Array<Category>,
  options?: { validationPercentage: number }
): Promise<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
}> => {
  // const data = tensorflow.data
  //   .generator(generator(images, categories))
  //   .map(encodeCategory(categories.length))
  //   .mapAsync(encodeImage)
  //   .mapAsync(resize);
  //
  // const validationData = tensorflow.data
  //   .generator(generator(images, categories))
  //   .map(encodeCategory(categories.length))
  //   .mapAsync(encodeImage)
  //   .mapAsync(resize);

  function* foo() {
    const n = 10;
    let index = 0;
    while (index < n) {
      index++;

      yield {
        xs: tensorflow.randomNormal([10, 224, 224, 3]),
        ys: tensorflow.oneHot(tensorflow.randomUniform([10], 0, 1), 2),
      };
    }
  }

  const data = tensorflow.data.generator(foo);

  return {
    data: data,
    validationData: data,
  };
};

/*
 * Sagas
 */

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(compiledAction({ compiled: compiled }));
}

export function* fitSaga(action: any) {
  const { callback } = action.payload;

  const compiled = yield select(compiledSelector);

  const data = yield select(dataSelector);

  const validationData = yield select(validationDataSelector);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(
    compiled,
    data,
    validationData,
    options,
    callback
  );

  yield put(fittedAction({ fitted: fitted, status: status }));
}

export function* generateSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(categoriesSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);
  const validationPercentage = yield select(validationPercentageSelector);

  yield put(
    updateImagesPartitionsAction({
      trainingPercentage: trainingPercentage,
      validationPercentage: validationPercentage,
    })
  );

  const { data } = yield generate(images, categories);

  yield put(generatedAction({ data: data }));
}

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(openedAction({ opened: opened }));
}

export function* watchCompileActionSaga() {
  yield takeEvery("CLASSIFIER_COMPILE", compileSaga);
}

export function* watchFitActionSaga() {
  yield takeEvery("CLASSIFIER_FIT", fitSaga);
}

export function* watchGenerateActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", generateSaga);
}

export function* watchOpenActionSaga() {
  yield takeEvery("CLASSIFIER_OPEN", openSaga);
}

export function* root() {
  const effects = [
    fork(watchCompileActionSaga),
    fork(watchFitActionSaga),
    fork(watchGenerateActionSaga),
    fork(watchOpenActionSaga),
  ];

  yield all(effects);
}

/*
 * Reducers
 */

const classifierState: Classifier = {
  compiling: false,
  evaluating: false,
  fitOptions: {
    epochs: 1,
    batchSize: 32,
    initialEpoch: 0,
  },
  fitting: false,
  generating: false,
  learningRate: 0.01,
  lossFunction: LossFunction.SoftmaxCrossEntropy,
  lossHistory: [],
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationAlgorithm: OptimizationAlgorithm.StochasticGradientDescent,
  predicting: false,
  saving: false,
  trainingPercentage: 0.5,
  validationLossHistory: [],
  validationPercentage: 0.25,
};

export const classifierReducer = createReducer(classifierState, {
  [compileAction.type]: (state) => {
    return {
      ...state,
      compiling: true,
    };
  },
  [compiledAction.type]: (state, action) => {
    const { compiled } = action.payload;

    return {
      ...state,
      compiled: compiled,
      compiling: false,
    };
  },
  [evaluateAction.type]: (state) => {
    return {
      ...state,
      evaluating: true,
    };
  },
  [evaluatedAction.type]: (state, action) => {
    const { evaluations } = action.payload;

    return {
      ...state,
      evaluating: false,
      evaluations: evaluations,
    };
  },
  [fitAction.type]: (state) => {
    return {
      ...state,
      fitting: true,
    };
  },
  [fittedAction.type]: (state, action) => {
    const { fitted, history } = action.payload;

    return {
      ...state,
      fitted: fitted,
      fitting: false,
      history: history,
    };
  },
  [generateAction.type]: (state) => {
    return {
      ...state,
      generating: true,
    };
  },
  [generatedAction.type]: (state, action) => {
    const { data, validationData } = action.payload;

    return {
      ...state,
      data: data,
      generating: false,
      validationData: validationData,
    };
  },
  [openAction.type]: (state) => {
    return {
      ...state,
      opening: true,
    };
  },
  [openedAction.type]: (state, action) => {
    const { opened } = action.payload;

    return {
      ...state,
      opened: opened,
      opening: false,
    };
  },
  [predictAction.type]: (state) => {
    return {
      ...state,
      predicting: true,
    };
  },
  [predictedAction.type]: (state, action) => {
    const { predictions } = action.payload;

    return {
      ...state,
      predicting: false,
      predictions: predictions,
    };
  },
  [saveAction.type]: (state) => {
    return {
      ...state,
      saving: true,
    };
  },
  [savedAction.type]: (state, action) => {},
  [updateBatchSizeAction.type]: (state, action) => {
    const { batchSize } = action.payload;
    state.fitOptions.batchSize = batchSize;
  },
  [updateEpochsAction.type]: (state, action) => {
    const { epochs } = action.payload;
    state.fitOptions.epochs = epochs;
  },
  [updateLearningRateAction.type]: (state, action) => {
    const { learningRate } = action.payload;

    return {
      ...state,
      learningRate: learningRate,
    };
  },
  [updateLossFunctionAction.type]: (state, action) => {
    const { lossFunction } = action.payload;

    return {
      ...state,
      lossFunction: lossFunction,
    };
  },
  [updateLossHistoryAction.type]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      lossHistory: [...state.lossHistory!, { x: batch, y: loss }],
    };
  },
  [updateMetricsAction.type]: (state, action) => {
    const { metrics } = action.payload;

    return {
      ...state,
      metrics: metrics,
    };
  },
  [updateOptimizationAlgorithmAction.type]: (state, action) => {
    const { optimizationFunction } = action.payload;

    return {
      ...state,
      optimizationFunction: optimizationFunction,
    };
  },
  [updateTrainingPercentageAction.type]: (state, action) => {
    const { trainingPercentage } = action.payload;

    return {
      ...state,
      trainingPercentage: trainingPercentage,
    };
  },
  [updateValidationLossHistoryAction.type]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      validationLossHistory: [
        ...state.validationLossHistory!,
        { x: batch, y: loss },
      ],
    };
  },
  [updateValidationPercentageAction.type]: (state, action) => {
    const { validationPercentage } = action.payload;

    return {
      ...state,
      validationPercentage: validationPercentage,
    };
  },
});

const initialProjectState: Project = {
  categories: [
    {
      color: "rgb(255, 255, 0)",
      id: "00000000-0000-0000-0000-000000000000",
      name: "Unknown",
    },
  ],
  images: [],
  name: "Untitled project",
};

const projectReducer = createReducer(initialProjectState, {
  [createCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ name: string; color: string }>
  ) => {
    const category: Category = {
      color: action.payload.color,
      id: v4().toString(),
      name: action.payload.name,
    };

    state.categories.push(category);
  },
  [createImageAction.type]: (
    state: Project,
    action: PayloadAction<{ src: string }>
  ) => {
    const image: Image = {
      id: v4(),
      name: "",
      src: action.payload.src,
      categoryId: "00000000-0000-0000-0000-000000000000",
    };

    state.images.push(image);
  },
  [createProjectAction.type]: (
    state: Project,
    action: PayloadAction<{ project: Project }>
  ) => {
    state.categories = action.payload.project.categories;
    state.name = action.payload.project.name;
    state.images = action.payload.project.images;
  },
  [updateCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ id: string; name: string; color: string }>
  ) => {
    const index = findIndex(state.categories, (category: Category) => {
      return category.id === action.payload.id;
    });
    state.categories[index].name = action.payload.name;
    state.categories[index].color = action.payload.color;
  },
  [updateImageCategoryAction.type]: (
    state: Project,
    action: PayloadAction<{ id: string; categoryId: string }>
  ) => {
    const index = findIndex(state.images, (image: Image) => {
      return image.id === action.payload.id;
    });

    if (index >= 0) {
      state.images[index].categoryId = action.payload.categoryId;
    }
  },
});

/*
 * Store
 */

const saga = createSagaMiddleware();

const enhancers: StoreEnhancer[] = [];

const middleware: Middleware[] = [logger, saga];

const preloadedState = {};

const reducers = {
  classifier: classifierReducer,
  project: projectReducer,
};

const reducer = combineReducers(reducers);

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: reducer,
};

export const store: EnhancedStore = configureStore(options);

saga.run(root);
