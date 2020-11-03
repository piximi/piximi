import { put, takeEvery } from "redux-saga/effects";
import { compileSaga } from "./compileSaga";
import { watchCompileActionSaga } from "./watchCompileActionSaga";
import { Metric } from "../../../types/Metric";
import { LossFunction } from "../../../types/LossFunction";
import { OptimizationAlgorithm } from "../../../types/OptimizationAlgorithm";
import { compile, open } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

describe("compile", () => {
  it("dispatches 'compile' action", () => {
    const saga = watchCompileActionSaga();

    expect(saga.next().value).toEqual(
      takeEvery(classifierSlice.actions.compile.type, compileSaga)
    );

    expect(saga.next().done).toBeTruthy();
  });

  it("executes the `compile` function", async () => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    const opened = await open(pathname, 10, 100);

    const options = {
      learningRate: 0.01,
      lossFunction: LossFunction.SoftmaxCrossEntropy,
      metrics: [Metric.CategoricalAccuracy],
      optimizationAlgorithm: OptimizationAlgorithm.StochasticGradientDescent,
    };

    const compiled = await compile(opened, options);

    const generator = compileSaga(
      classifierSlice.actions.compile({ opened: opened, options: options })
    );

    await generator.next();

    expect(generator.next(compiled).value).toEqual(
      put(classifierSlice.actions.updateCompiled({ compiled: compiled }))
    );

    expect(generator.next().done).toBeTruthy();
  });
});
