import "@tensorflow/tfjs-node";

import { compile, fit, generate, open } from "@piximi/models";
import {
  Category,
  Image,
  Loss,
  Metric,
  Optimizer,
  Partition,
} from "@piximi/types";
import { put, takeEvery } from "redux-saga/effects";

import { fitAction, fittedAction } from "../actions";
import { fitSaga, watchFitActionSaga } from "./fitSaga";

jest.setTimeout(50000);

const images: Array<Image> = [
  {
    categoryIdentifier: "11111111-1111-1111-1111-11111111111",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "11111111-1111-1111-1111-11111111111",
    partition: Partition.Training,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: [],
    },
  },
  {
    categoryIdentifier: "22222222-2222-2222-2222-22222222222",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "22222222-2222-2222-2222-22222222222",
    partition: Partition.Training,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: [],
    },
  },
];

const categories: Array<Category> = [
  {
    description: "a",
    identifier: "11111111-1111-1111-1111-11111111111",
    index: 1,
    visualization: {
      color: "#FFFFFF",
      visible: true,
    },
  },
  {
    description: "b",
    identifier: "22222222-2222-2222-2222-22222222222",
    index: 2,
    visualization: {
      color: "#FFFFFF",
      visible: true,
    },
  },
];

describe("fit", () => {
  it("dispatches 'fitAction'", () => {
    const saga = watchFitActionSaga();

    expect(saga.next().value).toEqual(takeEvery("CLASSIFIER_FIT", fitSaga));

    expect(saga.next().done).toBeTruthy();
  });

  it("executes the `fit` function", async () => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    const units = 100;

    const opened = await open(pathname, categories.length, units);

    const compileOptions = {
      learningRate: 0.01,
      lossFunction: Loss.CategoricalCrossentropy,
      metrics: [Metric.CategoricalAccuracy],
      optimizationFunction: Optimizer.SGD,
    };

    const compiled = await compile(opened, compileOptions);

    const { data, validationData } = await generate(images, categories);

    const options = { epochs: 1, batchSize: 32, initialEpoch: 0 };

    const { fitted, status } = await fit(
      compiled,
      data,
      validationData,
      options
    );

    const payload = {
      compiled: compiled,
      data: data,
      validationData: validationData,
      options: options,
    };

    const generator = fitSaga(fitAction(payload));

    await generator.next();

    expect(generator.next({ fitted: fitted, status: status }).value).toEqual(
      put(fittedAction({ fitted: fitted, status: status }))
    );

    expect(generator.next().done).toBeTruthy();
  });
});
