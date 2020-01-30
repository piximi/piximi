import {Loss, Metric, Optimizer} from "@piximi/types";

import {compile} from "./compile";
import {open} from "./open";

const path =
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

describe("compile", () => {
  it("metricsNames", async () => {
    const options = {
      learningRate: 0.01,
      lossFunction: Loss.CategoricalCrossentropy,
      metrics: [Metric.CategoricalAccuracy],
      optimizationFunction: Optimizer.SGD
    };

    const opened = await open(path, 10, 100);

    const compiled = await compile(opened, options);

    expect(compiled.metricsNames).toEqual(["loss", "categoricalAccuracy"]);
  });
});
