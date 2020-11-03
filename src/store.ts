import * as tensorflow from "@tensorflow/tfjs";
import { History, LayersModel, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import * as ImageJS from "image-js";
import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import logger from "redux-logger";
import { root } from "./store/sagas/root";
import { reducer } from "./store/reducer";
import { LossFunction } from "./types/LossFunction";
import { OptimizationAlgorithm } from "./types/OptimizationAlgorithm";
import { Category } from "./types/Category";
import { CompileOptions } from "./types/CompileOptions";
import { FitOptions } from "./types/FitOptions";
import { Image } from "./types/Image";

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

/*
 * Reducers
 */

/*
 * Store
 */

const saga = createSagaMiddleware();

const enhancers: StoreEnhancer[] = [];

const middleware: Middleware[] = [logger, saga];

const preloadedState = {};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: reducer,
};

export const store: EnhancedStore = configureStore(options);

saga.run(root);
