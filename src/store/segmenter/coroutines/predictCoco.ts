import {
  Tensor,
  Rank,
  tidy,
  image as TFImage,
  GraphModel,
  expandDims,
  dispose,
  getBackend,
  tensor2d,
  setBackend,
} from "@tensorflow/tfjs";
import { v4 as uuid4 } from "uuid";

import { decodeFromImgSrc } from "./preprocessSegmenter";

import {
  Category,
  RescaleOptions,
  DecodedAnnotationType,
  ObjectDetectionType,
  ImageType,
} from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

export const predictCoco = async (
  model: GraphModel,
  inferenceImages: ImageType[],
  createdCategories: Category[],
  possibleClasses: { [key: string]: ObjectDetectionType }
): Promise<{
  annotations: Array<{
    imageId: string;
    annotations: Array<DecodedAnnotationType>;
  }>;
  categories: Array<Category>;
}> => {
  const predictedAnnotations: Array<{
    imageId: string;
    annotations: Array<DecodedAnnotationType>;
  }> = [];

  const foundCategories: Array<Category> = [];

  for await (const image of inferenceImages) {
    const channels = image.shape.channels;
    const width = image.shape.width;
    const height = image.shape.height;
    const rescaleOptions: RescaleOptions = { rescale: false, center: false };
    const item = {
      srcs: image.src,
      annotations: [],
      id: image.id,
      shape: image.shape,
    };
    const decodedImage = await decodeFromImgSrc(channels, rescaleOptions, item);
    const expandedImage = expandDims(decodedImage.xs);

    const results = (await model.executeAsync(expandedImage)) as [
      Tensor<Rank.R3>,
      Tensor<Rank.R4>
    ];

    const scores = results[0].dataSync();
    const boxes = results[1].dataSync();

    dispose(decodedImage.xs);
    dispose(expandedImage);
    dispose(results);

    const [maxScores, classes] = calculateMaxScores(
      scores as Float32Array,
      results[0].shape[1],
      results[0].shape[2]
    );

    const maxNumBoxes = 20;
    const minScore = 0.5;
    const overlapThreshold = 0.5;
    const prevBackend = getBackend();
    // run post process in cpu
    if (getBackend() === "webgl") {
      setBackend("cpu");
    }
    const indexTensor = tidy(() => {
      const boxes2 = tensor2d(boxes, [
        results[1].shape[1],
        results[1].shape[3],
      ]);
      return TFImage.nonMaxSuppressionWithScore(
        boxes2,
        maxScores,
        maxNumBoxes,
        overlapThreshold,
        minScore,
        1
      ).selectedIndices;
    });
    const indexes = indexTensor.dataSync() as Float32Array;
    indexTensor.dispose();

    if (prevBackend !== getBackend()) {
      setBackend(prevBackend);
    }

    const annotations = annotationObjectsFromResults(
      width,
      height,
      boxes as Float32Array,
      indexes,
      classes,
      possibleClasses,
      createdCategories,
      foundCategories
    );

    predictedAnnotations.push({
      imageId: image.id,
      annotations: annotations.foundAnnotations,
    });
  }
  return { annotations: predictedAnnotations, categories: foundCategories };
};

const calculateMaxScores = (
  scores: Float32Array,
  numBoxes: number,
  numClasses: number
): [number[], number[]] => {
  const maxes = [];
  const classes = [];
  for (let i = 0; i < numBoxes; i++) {
    let max = Number.MIN_VALUE;
    let index = -1;
    for (let j = 0; j < numClasses; j++) {
      if (scores[i * numClasses + j] > max) {
        max = scores[i * numClasses + j];
        index = j;
      }
    }
    maxes[i] = max;
    classes[i] = index;
  }
  return [maxes, classes];
};

const annotationObjectsFromResults = (
  width: number,
  height: number,
  bboxDims: Float32Array,
  indices: Float32Array,
  classes: Array<number>,
  possibleClasses: { [key: string]: ObjectDetectionType },
  annotationCategories: Array<Category>,
  foundCategories: Array<Category>
): {
  foundAnnotations: Array<DecodedAnnotationType>;
} => {
  const annotationArray: Array<DecodedAnnotationType> = [];

  const count = indices.length;

  for (let i = 0; i < count; i++) {
    const bbox = [];
    for (let j = 0; j < 4; j++) {
      bbox[j] = bboxDims[indices[i] * 4 + j];
    }
    const minY = Math.round(bbox[0] * height);
    const minX = Math.round(bbox[1] * width);
    const maxY = Math.round(bbox[2] * height);
    const maxX = Math.round(bbox[3] * width);

    const annotationBbox = [minX, minY, maxX, maxY];
    const maskData = new Uint8Array((maxX - minX) * (maxY - minY)).fill(255);
    let catName = possibleClasses[classes[indices[i]] + 1].displayName;
    catName = catName.slice(0, 1).toUpperCase().concat(catName.slice(1));
    const category =
      annotationCategories.filter((category) => {
        return category.name === catName;
      })[0] ||
      foundCategories.filter((category) => {
        return category.name === catName;
      })[0];

    let catID: string;
    if (category) {
      catID = category.id;
    } else {
      const usedColors = annotationCategories.map((category: Category) => {
        return category.color;
      });
      const availableColos = Object.values(CATEGORY_COLORS).filter(
        (color: string) => !usedColors.includes(color)
      );
      const catColor =
        availableColos[Math.floor(Math.random() * availableColos.length)];
      catID = uuid4();
      foundCategories.push({
        name: catName,
        color: catColor,
        id: catID,
        visible: true,
      });
    }

    const id = uuid4();
    annotationArray.push({
      boundingBox: annotationBbox as [number, number, number, number],
      categoryId: catID!,
      id: id,
      maskData: maskData,
      plane: 1,
    });
  }
  return {
    foundAnnotations: annotationArray,
  };
};
