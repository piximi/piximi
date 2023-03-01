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
  Tensor4D,
  tensor,
} from "@tensorflow/tfjs";
import { v4 as uuid4 } from "uuid";

import { decodeFromImgSrc } from "./preprocessSegmenter";

import {
  Category,
  ImageType,
  RescaleOptions,
  decodedAnnotationType,
  Point,
} from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { scanline, simplifyPolygon } from "utils/annotator";
import { connectPoints } from "utils/common";

export const predictStardist = async (
  model: GraphModel,
  inferenceImages: ImageType[],
  createdCategories: Category[]
): Promise<{
  annotations: Array<{
    imageId: string;
    annotations: Array<decodedAnnotationType>;
  }>;
  categories: Array<Category>;
}> => {
  const predictedAnnotations: Array<{
    imageId: string;
    annotations: Array<decodedAnnotationType>;
  }> = [];

  const foundCategories: Array<Category> = [];

  for await (const image of inferenceImages) {
    const channels = image.shape.channels;
    const rescaleOptions: RescaleOptions = { rescale: false, center: false };
    const item = {
      srcs: image.src,
      annotations: [],
      id: image.id,
      shape: image.shape,
    };
    const decodedImage = await decodeFromImgSrc(channels, rescaleOptions, item);
    const expandedImage = expandDims(decodedImage.xs);

    const padX =
      image.shape.width % 16 === 0 ? 0 : 16 - (image.shape.width % 16);
    const padY =
      image.shape.height % 16 === 0 ? 0 : 16 - (image.shape.height % 16);
    let imageTensor: Tensor4D;
    if (!(padX === 0 && padY === 0)) {
      imageTensor = expandedImage
        .mirrorPad(
          [
            [0, 0],
            [
              padY % 2 === 0 ? padY / 2 : Math.floor(padY / 2),
              padY % 2 === 0 ? padY / 2 : Math.ceil(padY / 2),
            ],
            [
              padX % 2 === 0 ? padX / 2 : Math.floor(padX / 2),
              padX % 2 === 0 ? padX / 2 : Math.ceil(padX / 2),
            ],
            [0, 0],
          ],
          "reflect"
        )
        .asType("float32")
        .div(255) as Tensor4D;
    } else {
      imageTensor = expandedImage.asType("float32").div(255) as Tensor4D;
    }

    const results = model.execute(imageTensor) as Tensor<Rank.R4>;
    const annotationCategory = generateNewCategory(
      "Necleus",
      createdCategories
    );
    foundCategories.push(annotationCategory);
    const preds = results.arraySync()[0];

    dispose(decodedImage.xs);
    dispose(expandedImage);
    dispose(imageTensor);
    dispose(results);

    const { generatedAnnotations, scores, generartedBBoxes } =
      generateAnnotations(
        preds,
        annotationCategory.id,
        padX,
        padY,
        image.shape.width,
        image.shape.height
      );

    const minScore = 0.5;
    const overlapThreshold = 0.1;
    const prevBackend = getBackend();

    const indexTensor = tidy(() => {
      const bboxTensor = tensor2d(generartedBBoxes);
      const scoresTensor = tensor(scores) as Tensor<Rank.R1>;
      if (getBackend() === "webgl") {
        setBackend("cpu");
      }
      return TFImage.nonMaxSuppressionWithScore(
        bboxTensor,
        scoresTensor,
        500,
        overlapThreshold,
        minScore
      ).selectedIndices;
    });
    const indices = indexTensor.dataSync() as Float32Array;
    indexTensor.dispose();
    if (prevBackend !== getBackend()) {
      setBackend(prevBackend);
    }

    const selectedAnnotations: Array<decodedAnnotationType> = [];
    indices.forEach((index) => {
      selectedAnnotations.push(generatedAnnotations[index]);
    });

    predictedAnnotations.push({
      imageId: image.id,
      annotations: selectedAnnotations,
    });
  }
  return { annotations: predictedAnnotations, categories: foundCategories };
};

export const computeAnnotationMaskFromPoints = (
  cropDims: { x: number; y: number; width: number; height: number },
  coordinates: Array<Point>,
  imgWidth: number,
  imgHeight: number
) => {
  const connectedPoints = connectPoints(coordinates!); // get coordinates of connected points and draw boundaries of mask

  const simplifiedPoints = simplifyPolygon(connectedPoints);

  const maskImage = scanline(simplifiedPoints, imgWidth, imgHeight);

  // @ts-ignore: getChannel API is not exposed
  const greyScaleMask = maskImage.getChannel(0); // as ImageJS.Image;
  const cropped = greyScaleMask.crop(cropDims);
  return cropped;
};
export function buildPolygon(
  lengths: Array<number>,
  i: number,
  j: number,
  padX: number,
  padY: number,
  imgWidth: number,
  imgHeight: number
) {
  const points: Array<Point> = [];
  var xMin = Infinity;
  var yMin = Infinity;
  var xMax = 0;
  var yMax = 0;
  lengths.forEach((length, idx) => {
    const x = Math.max(
      0,
      Math.min(imgWidth, Math.round(j + length * Math.cos(idx * 0.19625)))
    );
    xMin = x < xMin ? x : xMin;
    xMax = x > xMax ? x : xMax;
    const y = Math.max(
      0,
      Math.min(imgHeight, Math.round(i + length * Math.sin(idx * 0.19625)))
    );
    yMin = y < yMin ? y : yMin;
    yMax = y > yMax ? y : yMax;

    points.push({
      x: x,
      y: y,
    });
  });
  let bbox: [number, number, number, number] = [xMin, yMin, xMax, yMax];
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  let cropDims = { x: bbox[0], y: bbox[1], width: width, height: height };

  const poly = computeAnnotationMaskFromPoints(
    cropDims,
    points,
    imgWidth,
    imgHeight
  );
  return { maskData: poly!.data, bbox: bbox };
}

export function generateAnnotations(
  preds: number[][][],
  categoryId: string,
  padX: number,
  padY: number,
  width: number,
  height: number
) {
  const generatedAnnotations: Array<decodedAnnotationType> = [];
  const generartedBBoxes: Array<[number, number, number, number]> = [];
  const scores: Array<number> = [];
  var i = 0;

  preds.forEach((row: Array<Array<number>>) => {
    var j = 0;
    row.forEach((output: Array<number>) => {
      if (output[0] > 0.3) {
        const { maskData, bbox } = buildPolygon(
          output.slice(1),
          i,
          j,
          padX,
          padY,
          width,
          height
        );
        const annotation: decodedAnnotationType = {
          maskData: maskData,
          boundingBox: bbox,
          categoryId: categoryId,
          id: uuid4(),
          plane: 1,
        };
        generatedAnnotations.push(annotation);
        scores.push(output[0]);
        generartedBBoxes.push(bbox);
      }
      j++;
    });
    i++;
  });
  return { generatedAnnotations, scores, generartedBBoxes };
}

const generateNewCategory = (
  name: string,
  annotationCategories: Array<Category>
) => {
  const usedColors = annotationCategories.map((category: Category) => {
    return category.color;
  });
  const availableColos = Object.values(CATEGORY_COLORS).filter(
    (color: string) => !usedColors.includes(color)
  );
  const catColor =
    availableColos[Math.floor(Math.random() * availableColos.length)];
  const catID = uuid4();
  return {
    name: name,
    color: catColor,
    id: catID,
    visible: true,
  };
};
