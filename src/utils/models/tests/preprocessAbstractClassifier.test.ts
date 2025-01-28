import { expect, it } from "vitest";
import "@tensorflow/tfjs-node";
import { SequentialClassifier } from "../classification/AbstractClassifier/AbstractClassifier";

import { fileFromPath } from "utils/file-io/nodeImageHelper";
import {
  CropOptions,
  FitOptions,
  PreprocessOptions,
  RescaleOptions,
} from "../types";
import { CropSchema, ModelTask } from "../enums";
import { loadImageFileAsStack } from "utils/file-io/helpers";
import { convertToImage } from "utils/common/tensorHelpers";
import { MIMEType } from "utils/file-io/types";
import { Category, ImageObject, Shape } from "store/data/types";

class GenericClassifier extends SequentialClassifier {
  constructor() {
    super({
      name: "GenericClassifier",
      task: ModelTask.Classification,
      graph: false,
      pretrained: false,
      trainable: false,
    });
  }

  loadModel() {}

  get testTrainingDataArray() {
    if (!this._trainingDataset) {
      throw Error(`No training dataset loaded in "${this.name}" model`);
    }

    // future warning: toArrayForTest is undocumented
    return this._trainingDataset.toArrayForTest();
  }
}

const inputShape: Shape = {
  planes: 1,
  height: 224,
  width: 224,
  channels: 3,
};

const rescaleOptions: RescaleOptions = {
  rescale: true,
  center: false,
};

const cropOptions: CropOptions = {
  numCrops: 1,
  cropSchema: CropSchema.None,
};

const preprocessOptions: PreprocessOptions = {
  shuffle: true,
  rescaleOptions,
  cropOptions,
};

const fitOptions: FitOptions = {
  epochs: 10,
  batchSize: 32,
};

const categories: Array<Category> = [
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000001",
    kind: "",
    containing: [],
    name: "",
    visible: true,
  },
  {
    color: "",
    id: "00000000-0000-0000-0000-00000000002",
    kind: "",
    containing: [],
    name: "",
    visible: true,
  },
];

const preloadedImages: Array<{
  src: string;
  name: string;
  mimetype: MIMEType;
}> = [
  {
    src: "https://picsum.photos/seed/piximi/224",
    name: "224.jpg",
    mimetype: "image/jpeg",
  },
];

const urlToStack = async (src: string, name: string, mimetype: MIMEType) => {
  const file = await fileFromPath(src, mimetype, true, name);

  return loadImageFileAsStack(file);
};

it("preprocessClassifier", async () => {
  const images: Array<ImageObject> = [];

  for (const preIm of preloadedImages) {
    const imStack = await urlToStack(preIm.src, preIm.name, preIm.mimetype);
    const im = await convertToImage(
      imStack,
      preIm.name,
      undefined,
      1,
      imStack.length,
    );
    images.push(im);
  }

  const model = new GenericClassifier();
  model.loadTraining(images, {
    categories,
    inputShape,
    preprocessOptions,
    fitOptions,
  });

  expect(model.trainingLoaded).toBeTruthy();

  const items = await model.testTrainingDataArray;

  expect(items[0]["xs"].shape).toEqual([1, 224, 224, 3]);
  expect(items[0]["ys"].shape).toEqual([1, 2]);
});
