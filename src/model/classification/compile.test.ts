import { compile } from "./compile";
import { open } from "./open";
import { LossFunction, OptimizationAlgorithm } from "../../store";

const path =
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

describe("compile", () => {
  it("lossFunction", async () => {
    const options = {
      learningRate: 0.01,
      lossFunction: LossFunction.SoftmaxCrossEntropy,
      optimizationAlgorithm: OptimizationAlgorithm.StochasticGradientDescent,
    };

    const opened = await open(path, 10, 100);

    const compiled = await compile(opened, options);

    expect(compiled.metricsNames).toEqual(["loss"]);
  });
});
