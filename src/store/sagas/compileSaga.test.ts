import { compile, open } from "@piximi/models";
import { Loss, Metric, Optimizer } from "@piximi/types";
import { put, takeEvery } from "redux-saga/effects";

import { compileAction, compiledAction } from "../actions";
import { compileSaga, watchCompileActionSaga } from "./compileSaga";

describe("compile", () => {
  it("dispatches 'compileAction'", () => {
    const saga = watchCompileActionSaga();

    expect(saga.next().value).toEqual(
      takeEvery("CLASSIFIER_COMPILE", compileSaga)
    );

    expect(saga.next().done).toBeTruthy();
  });

  it("executes the `compile` function", async () => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    const opened = await open(pathname, 10, 100);

    const options = {
      learningRate: 0.01,
      lossFunction: Loss.CategoricalCrossentropy,
      metrics: [Metric.CategoricalAccuracy],
      optimizationFunction: Optimizer.SGD,
    };

    const compiled = await compile(opened, options);

    const generator = compileSaga(
      compileAction({ opened: opened, options: options })
    );

    await generator.next();

    expect(generator.next(compiled).value).toEqual(
      put(compiledAction({ compiled: compiled }))
    );

    expect(generator.next().done).toBeTruthy();
  });
});
