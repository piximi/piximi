// TODO: post PR #407, get working for segmenter
import { expect, it } from "vitest";
import "@tensorflow/tfjs-node";
import { preprocessSegmentationImages } from "../segmentation/FullyConvolutionalSegmenter/preprocessSegmenter";
import { fileFromPath } from "utils/file-io/nodeImageHelper";
import { generateUUID } from "store/data/utils";
import {
  CropOptions,
  FitOptions,
  SegmenterPreprocessSettings,
  RescaleOptions,
} from "../types";
import { CropSchema, Partition } from "../enums";
import { MIMEType } from "utils/file-io/types";
import { loadImageFileAsStack } from "utils/file-io/utils";
import { convertToImage } from "utils/tensorUtils";
import {
  Category,
  ImageObject,
  AnnotationObject,
  Shape,
} from "store/data/types";
import { MIMETYPES } from "utils/file-io/enums";

//jest.setTimeout(50000);

const inputShape: Shape = {
  planes: 1,
  height: 256,
  width: 256,
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

const preprocessingOptions: SegmenterPreprocessSettings = {
  shuffle: true,
  rescaleOptions,
  cropOptions,
};

const fitOptions: FitOptions = {
  epochs: 10,
  batchSize: 32,
};

const annotationCategories: Array<Category> = [
  {
    color: "#920000",
    id: "00000000-0000-1111-0000-000000000000",
    name: "Unknown",
    kind: "",
    containing: [],
    visible: true,
  },
  {
    color: "#006ddb",
    id: "1dca6ba0-c53b-435d-a43f-d4a2bb4042a5",
    name: "Test",
    kind: "",
    containing: [],
    visible: true,
  },
];

const preloadedImages: Array<{
  id: string;
  src: string;
  name: string;
  mimetype: MIMEType;
  annotations: Array<
    Omit<
      AnnotationObject,
      "kind" | "data" | "shape" | "bitDepth" | "name" | "src" | "partition"
    >
  >;
}> = [generateUUID()].map((imId) => ({
  id: imId,
  src: "/static/media/cell-painting.f118ef087853056f08e6.png",
  name: "cell-painting.png",
  mimetype: MIMETYPES.PNG,
  annotations: [
    {
      boundingBox: [86, 149, 217, 240],
      categoryId: "1dca6ba0-c53b-435d-a43f-d4a2bb4042a5",
      id: "59b919c0-f052-4df6-b947-bb8f3c9359a7",
      encodedMask: [0, 11921],
      activePlane: 0,
      imageId: imId,
      timePoint: 0,
    },
  ],
}));

const urlToStack = async (src: string, name: string, mimetype: MIMEType) => {
  const file = await fileFromPath(src, mimetype, false, name);

  return loadImageFileAsStack(file);
};

it.skip("preprocessSegmenter", async () => {
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

    images.push({
      ...im,
      partition: Partition.Training,
    });
  }

  const preprocessed = await preprocessSegmentationImages(
    images,
    annotationCategories,
    inputShape,
    preprocessingOptions,
    fitOptions,
  );

  // future warning: toArrayForTest is undocumented
  const items = await preprocessed.toArrayForTest();

  expect(items[0]["xs"].shape).toEqual([256, 256, 3]);
  expect(items[0]["ys"].shape).toEqual([256, 256, 1]);
});
