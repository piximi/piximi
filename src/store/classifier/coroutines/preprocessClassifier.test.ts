import "@tensorflow/tfjs-node";
import { preprocessClassifier } from "./preprocessClassifier";

import {
  Category,
  ImageType,
  Partition,
  Shape,
  RescaleOptions,
  FitOptions,
  PreprocessOptions,
  CropOptions,
  CropSchema,
} from "types";

import { generateDefaultChannels } from "utils/common/imageHelper";

jest.setTimeout(50000);

const inputShape: Shape = {
  width: 224,
  channels: 3,
  frames: 1,
  height: 224,
  planes: 1,
};

const rescaleOptions: RescaleOptions = {
  rescale: true,
  center: false,
};

const cropOptions: CropOptions = {
  numCrops: 1,
  cropSchema: CropSchema.None,
};

const preprocessingOptions: PreprocessOptions = {
  shuffle: true,
  rescaleOptions,
  cropOptions,
};

const fitOptions: FitOptions = {
  epochs: 10,
  batchSize: 32,
  initialEpoch: 0,
};

const categories: Array<Category> = [
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000001",
    name: "",
    visible: true,
  },
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000002",
    name: "",
    visible: true,
  },
];

const images: Array<ImageType> = [
  {
    activePlane: 0,
    categoryId: "00000000-0000-0000-0000-00000000001",
    colors: generateDefaultChannels(inputShape.channels),
    id: "00000000-0000-0000-0001-00000000000",
    annotations: [],
    name: "",
    originalSrc: [],
    src: "https://picsum.photos/seed/piximi/224",
    partition: Partition.Training,
    visible: true,
    shape: inputShape,
  },
];

it("preprocessClassifier", async () => {
  const preprocessed = await preprocessClassifier(
    images,
    categories,
    inputShape,
    preprocessingOptions,
    fitOptions
  );

  // future warning: toArrayForTest is undocumented
  const items = await preprocessed.toArrayForTest();

  expect(items[0]["xs"].shape).toEqual([224, 224, 3]);
});
