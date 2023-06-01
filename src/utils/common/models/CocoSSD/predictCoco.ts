// mostly taken from here: https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/index.ts

import {
  Tensor,
  Rank,
  tidy,
  image as tfimage,
  GraphModel,
  dispose,
  getBackend,
  tensor2d,
  setBackend,
  Tensor4D,
} from "@tensorflow/tfjs";
import { v4 as uuid4 } from "uuid";

import { Category, DecodedAnnotationType } from "types";

export const predictCoco = async (
  model: GraphModel,
  imTensor: Tensor4D,
  categories: Array<Category>,
  maxNumBoxes = 20,
  minScore = 0.5,
  overlapThreshold = 0.5
) => {
  const height = imTensor.shape[1];
  const width = imTensor.shape[2];

  const results = (await model.executeAsync(imTensor)) as [
    Tensor<Rank.R3>,
    Tensor<Rank.R4>
  ];

  // length of `scores` is number of bounding boxes found (total)
  // multiplied by the number of classes
  // each score, i, is the confidence that bounding, i, is correct
  // for the respective class
  // box 1, class 1; box 1 class 2; ...; box 2 class 1; ...
  const scores = results[0].dataSync() as Float32Array;
  // `boxes` is 4x the length of the total number of boxes
  // class 1, box 1: y_1, x_1, y_2, x_2;
  // class 1, box 2; ...; class 2 box 1; ...
  const boxes = results[1].dataSync() as Float32Array;

  dispose(imTensor);
  dispose(results);

  const [maxScores, classes] = calculateMaxScores(
    scores,
    results[0].shape[1], // num boxes
    results[0].shape[2] // num classes
  );

  const prevBackend = getBackend();
  // run post process in cpu
  if (getBackend() === "webgl") {
    setBackend("cpu");
  }

  // TODO - segmenter: type annotate with rank
  // I'm guessing 1-d tensor, of length == number of boxes selected by NMS
  // values being equal to the index in `boxes` of chosen boxes
  const indexTensor = tidy(() => {
    // TODO - segmenter: figure out why we can take a 4d tensor and convert it
    // to a 2d tensor directly
    const boxesT = tensor2d(boxes, [results[1].shape[1], results[1].shape[3]]);

    return tfimage.nonMaxSuppressionWithScore(
      boxesT,
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

  return buildDetectedObjects(
    width,
    height,
    boxes,
    indexes,
    classes,
    categories
  );
};

// max[i] is the max confidence for box i across all classes
// classes[i] is the index of the class with max prob for box i
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

const buildDetectedObjects = (
  width: number,
  height: number,
  boxes: Float32Array,
  indices: Float32Array,
  classes: Array<number>,
  categories: Array<Category>
) => {
  const annotations: Array<DecodedAnnotationType> = [];
  const count = indices.length;

  for (let i = 0; i < count; i++) {
    const bbox = [];
    for (let j = 0; j < 4; j++) {
      bbox[j] = boxes[indices[i] * 4 + j];
    }

    const minY = Math.round(bbox[0] * height);
    const minX = Math.round(bbox[1] * width);
    const maxY = Math.round(bbox[2] * height);
    const maxX = Math.round(bbox[3] * width);

    // x_1, y_1, x_2, y_2
    //const annotationBbox = [minX, minY, maxX, maxY];
    // x_1, y_1, W, H
    const annotationBbox = [minX, minY, maxX - minX, maxY - minY] as [
      number,
      number,
      number,
      number
    ];

    const maskData = new Uint8Array((maxX - minX) * (maxY - minY)).fill(255);

    const category = categories[classes[indices[i]]];

    annotations.push({
      boundingBox: annotationBbox,
      categoryId: category.id,
      id: uuid4(),
      maskData,
      plane: 0,
    });
  }
  return annotations;
};
