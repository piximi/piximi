import "@tensorflow/tfjs-node";

import {
  Loss,
  Metric,
  Image,
  Optimizer,
  Partition,
  Category,
} from "@piximi/types";
import { compile } from "./compile";
import { fit } from "./fit";
import { open } from "./open";
import { generate } from "./generate";

jest.setTimeout(50000);

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

const pathname =
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

it("fit", async () => {
  const opened = await open(pathname, categories.length, 100);

  const options = {
    learningRate: 0.01,
    lossFunction: Loss.CategoricalCrossentropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationFunction: Optimizer.SGD,
  };

  const compiled = await compile(opened, options);

  const { data, validationData } = await generate(images, categories);

  const { fitted, status } = await fit(compiled, data, data, {
    epochs: 1,
    batchSize: 32,
    initialEpoch: 1,
  });

  const expected = [
    "categoricalAccuracy",
    "loss",
    "val_categoricalAccuracy",
    "val_loss",
  ];

  expect(Object.keys(status.history).sort()).toEqual(expected.sort());
});
