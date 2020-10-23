import * as tensorflow from "@tensorflow/tfjs";

import { open } from "./open";

const pathname =
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

describe("open", () => {
  it("inputs", async () => {
    const opened = await open(pathname, 10, 100);

    expect(opened.inputs.length).toEqual(1);
    expect(opened.inputs[0].shape).toEqual([null, 224, 224, 3]);
  });

  it("layers", async () => {
    const opened = await open(pathname, 10, 100);

    expect(opened.layers.length).toEqual(85);
  });

  it("outputShape", async () => {
    const opened = await open(pathname, 10, 100);

    expect(opened.outputShape).toEqual([null, 10]);
  });
});
