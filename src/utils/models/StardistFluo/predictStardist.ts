import {
  Tensor4D,
  GraphModel,
  dispose,
  tidy,
  image as TFImage,
  tensor2d,
  tensor1d,
  setBackend,
  getBackend,
} from "@tensorflow/tfjs";

import { encode, scanline, simplifyPolygon } from "utils/annotator";
import { connectPoints } from "utils/annotator";
import { OrphanedAnnotationObject } from "../AbstractSegmenter/AbstractSegmenter";
import { generateUUID } from "utils/common/helpers";
import { Partition } from "../enums";
import { Point } from "utils/annotator/types";

const computeAnnotationMaskFromPoints = (
  cropDims: { x: number; y: number; width: number; height: number },
  coordinates: Array<Point>,
  imH: number,
  imW: number
) => {
  // get coordinates of connected points and draw boundaries of mask
  const connectedPoints = connectPoints(coordinates);
  const simplifiedPoints = simplifyPolygon(connectedPoints);
  const maskImage = scanline(simplifiedPoints, imW, imH);
  // @ts-ignore: getChannel API is not exposed
  const greyScaleMask = maskImage.getChannel(0); // as ImageJS.Image;
  const cropped = greyScaleMask.crop(cropDims);

  return cropped;
};

function buildPolygon(
  distances: Array<number>,
  row: number,
  col: number,
  imH: number,
  imW: number,
  inputImDims: {
    width: number;
    height: number;
    padX: number;
    padY: number;
  }
) {
  const THETA = (2 / distances.length) * Math.PI; // 0.19635, for 32 distances
  const points: Array<Point> = [];
  var xMin = Infinity;
  var yMin = Infinity;
  var xMax = 0;
  var yMax = 0;

  distances.forEach((length, idx) => {
    const y = Math.max(
      0,
      Math.min(
        imH - 1,
        Math.round(
          row +
            length * Math.sin(idx * THETA) -
            Math.floor(inputImDims.padY / 2)
        )
      )
    );

    const x = Math.max(
      0,
      Math.min(
        imW - 1,
        Math.round(
          col +
            length * Math.cos(idx * THETA) -
            Math.floor(inputImDims.padX / 2)
        )
      )
    );

    yMin = y < yMin ? y : yMin;
    yMax = y > yMax ? y : yMax;

    xMin = x < xMin ? x : xMin;
    xMax = x > xMax ? x : xMax;

    points.push({ x, y });
  });

  let bbox: [number, number, number, number] = [
    Math.max(0, xMin),
    Math.max(0, yMin),
    Math.min(inputImDims.width, xMax),
    Math.min(inputImDims.height, yMax),
  ];

  const boxH = bbox[3] - bbox[1];
  const boxW = bbox[2] - bbox[0];

  if (boxW <= 0 || boxH <= 0) return;

  let cropDims = { x: bbox[0], y: bbox[1], width: boxW, height: boxH };

  const poly = computeAnnotationMaskFromPoints(cropDims, points, imH, imW);

  return { decodedMask: poly.data, bbox: bbox };
}

function generateAnnotations(
  preds: number[][][],
  kindId: string,
  unknownCategoryId: string,
  height: number,
  width: number,
  inputImDims: {
    width: number;
    height: number;
    padX: number;
    padY: number;
  },
  scoreThresh: number
) {
  const generatedAnnotations: Array<OrphanedAnnotationObject> = [];
  const scores: Array<number> = [];
  const generatedBboxes: Array<[number, number, number, number]> = [];

  preds.forEach((row: Array<Array<number>>, i) => {
    row.forEach((output: Array<number>, j) => {
      if (output[0] >= scoreThresh) {
        const polygon = buildPolygon(
          output.slice(1), // radial distances
          i,
          j,
          height,
          width,
          inputImDims
        );

        if (!polygon) return;

        scores.push(output[0]);

        const { decodedMask, bbox } = polygon;

        const annotation = {
          encodedMask: encode(decodedMask),
          boundingBox: bbox,
          kind: kindId,
          categoryId: unknownCategoryId,
          partition: Partition.Unassigned,
          id: generateUUID(),
          activePlane: 0,
        };

        generatedAnnotations.push(annotation);
        generatedBboxes.push(bbox);
      }
    });
  });
  return { generatedAnnotations, generatedBboxes, scores };
}
export const predictStardist = async (
  model: GraphModel,
  imTensor: Tensor4D, // expects 1 for batchSize dim (axis 0)
  kindId: string, // foreground (nucleus kind)
  unknownCategoryId: string,
  inputImDims: {
    width: number;
    height: number;
    padX: number;
    padY: number;
  },
  NMS_IoUThresh: number = 0.1,
  NMS_scoreThresh: number = 0.3,
  NMS_maxOutputSize: number = 500,
  NMS_softNmsSigma: number = 0.0
) => {
  // [batchSize, H, W, 33]
  const res = model.execute(imTensor) as Tensor4D;
  const preds = (await res.array())[0];

  dispose(imTensor);
  dispose(res);

  const prevBackend = getBackend();

  if (prevBackend === "webgl") {
    setBackend("cpu");
  }

  const { generatedAnnotations, generatedBboxes, scores } = generateAnnotations(
    preds,
    kindId,
    unknownCategoryId,
    res.shape[1], // H
    res.shape[2], // W
    inputImDims,
    NMS_scoreThresh
  );

  const indexTensor = tidy(() => {
    const bboxTensor = tensor2d(generatedBboxes);
    const scoresTensor = tensor1d(scores);

    return TFImage.nonMaxSuppressionWithScore(
      bboxTensor,
      scoresTensor,
      NMS_maxOutputSize,
      NMS_IoUThresh,
      NMS_scoreThresh,
      NMS_softNmsSigma
    ).selectedIndices;
  });

  const indices = (await indexTensor.data()) as Float32Array;
  dispose(indexTensor);

  const selectedAnnotations: Array<OrphanedAnnotationObject> = [];

  indices.forEach((index) => {
    selectedAnnotations.push(generatedAnnotations[index]);
  });

  if (prevBackend !== getBackend()) {
    setBackend(prevBackend);
  }

  return selectedAnnotations;
};
