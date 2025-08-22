import { expect, it } from "vitest";
import "@tensorflow/tfjs-node";
import { SequentialClassifier } from "../classification/AbstractClassifier/AbstractClassifier";

import { fileFromPath } from "utils/file-io/nodeImageHelper";
// import {
//   CropOptions,
//   FitOptions,
//   PreprocessSettings,
//   RescaleOptions,
// } from "../types";
import {
  //CropSchema,
  ModelTask,
} from "../enums";
import { loadImageFileAsStack } from "utils/file-io/utils";
import { convertToImage } from "utils/tensorUtils";
import { MIMEType } from "utils/file-io/types";
import { Category, ImageObject } from "store/data/types";
import { MIMETYPES } from "utils/file-io/enums";
import { getDefaultModelInfo } from "../classification/utils";
import path from "path";
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

  loadModel() {
    const defaultModelInfo = getDefaultModelInfo();
    this._preprocessingOptions = {
      inputShape: {
        height: 224,
        width: 224,
        channels: 3,
      },
      ...defaultModelInfo.preprocessSettings.cropOptions,
      shuffle: defaultModelInfo.preprocessSettings.shuffle,
      rescale: defaultModelInfo.preprocessSettings.rescaleOptions.rescale,
      batchSize: defaultModelInfo.optimizerSettings.batchSize,
    };
    this._optimizerSettings = defaultModelInfo.optimizerSettings;
  }

  get testTrainingDataArray() {
    if (!this._trainingDataset) {
      throw Error(`No training dataset loaded in "${this.name}" model`);
    }

    // future warning: toArrayForTest is undocumented
    return this._trainingDataset.toArrayForTest();
  }
}

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
    src: path.resolve("src/images/cell-painting.png"),
    name: "cell-painting.png",
    mimetype: MIMETYPES.PNG,
  },
];

const urlToStack = async (src: string, name: string, mimetype: MIMEType) => {
  const file = await fileFromPath(src, mimetype, false, name);

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
  model.loadModel();
  expect(model.preprocessingOptions).toBeDefined();
  model.loadTraining(images, categories);

  expect(model.trainingLoaded).toBeTruthy();

  const items = await model.testTrainingDataArray;

  expect(items[0]["xs"].shape).toEqual([1, 224, 224, 3]);
  expect(items[0]["ys"].shape).toEqual([1, 2]);
});
