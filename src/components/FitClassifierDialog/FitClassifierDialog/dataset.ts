import * as ImageJS from "image-js";
import * as tensorflow from "@tensorflow/tfjs";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";

export const createTrainingSet = async (
  categories: Category[],
  labledData: Image[],
  numberOfClasses: number
) => {
  const trainingData: Image[] = [];
  for (let i = 0; i < labledData.length; i++) {
    if (labledData[i].partition === 0) {
      trainingData.push(labledData[i]);
    }
  }

  const trainDataSet = await createLabledTensorflowDataSet(
    trainingData,
    categories
  );

  let concatenatedTensorData = tensorflow.tidy(() =>
    tensorflow.concat(trainDataSet.data)
  );
  let concatenatedLabelData = tensorflow.tidy(() =>
    tensorflow.oneHot(trainDataSet.labels, numberOfClasses)
  );

  trainDataSet.data.forEach((tensor: tensorflow.Tensor<tensorflow.Rank>) =>
    tensor.dispose()
  );

  return { data: concatenatedTensorData, labels: concatenatedLabelData };
};

export const createAutotunerDataSet = async (
  categories: Category[],
  labelData: Image[]
) => {
  const trainingData: Image[] = [];
  for (let i = 0; i < labelData.length; i++) {
    if (labelData[i].partition === 0) {
      trainingData.push(labelData[i]);
    }
  }

  const trainDataSet = await createLabledTensorflowDataSet(
    trainingData,
    categories
  );

  var datapoints: {
    data: tensorflow.Tensor<tensorflow.Rank>;
    labels: number;
  }[] = [];
  for (let i = 0; i < trainDataSet.labels.length; i++) {
    datapoints.push({
      data: trainDataSet.data[i],
      labels: trainDataSet.labels[i],
    });
  }

  return datapoints;
};

export const createTestSet = async (
  categories: Category[],
  images: Image[]
) => {
  const labeledData = images.filter((image: Image) => {
    return image.categoryId !== "00000000-0000-0000-0000-000000000000";
  });

  const testData: Image[] = [];
  for (let i = 0; i < labeledData.length; i++) {
    if (labeledData[i].partition === 2) {
      testData.push(labeledData[i]);
    }
  }

  const testDataSet = await createLabledTensorflowDataSet(testData, categories);

  return { data: testDataSet.data, labels: testDataSet.labels };
};

export const createPredictionSet = async (images: Image[]) => {
  const predictionImageSet = images.filter(
    (image: Image) =>
      image.categoryId === "00000000-0000-0000-0000-000000000000"
  );

  const predictionTensorSet: tensorflow.Tensor<tensorflow.Rank>[] = [];
  const imageIdentifiers: string[] = [];

  for (const image of predictionImageSet) {
    predictionTensorSet.push(await tensorImageData(image));
    imageIdentifiers.push(image.id);
  }
  return { data: predictionTensorSet, identifiers: imageIdentifiers };
};

var TESTSET_RATIO = 0.2;

export const assignToSet = (): number => {
  const rdn = Math.random();
  if (rdn < TESTSET_RATIO) {
    return 2;
  } else {
    return 0;
  }
};

export const setTestsetRatio = (testsetRatio: number) => {
  TESTSET_RATIO = testsetRatio;
};

const createLabledTensorflowDataSet = async (
  labledData: Image[],
  categories: Category[]
) => {
  let tensorData: tensorflow.Tensor<tensorflow.Rank>[] = [];
  let tensorLabels: number[] = [];

  for (const image of labledData) {
    tensorData.push(await tensorImageData(image));
    tensorLabels.push(findCategoryIndex(categories, image.categoryId!));
  }

  return { data: tensorData, labels: tensorLabels };
};

const imageToSquare = (
  image: HTMLImageElement | HTMLCanvasElement,
  size: number
): HTMLCanvasElement => {
  const dimensions =
    image instanceof HTMLImageElement
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : image;

  const scale = size / Math.max(dimensions.height, dimensions.width);
  const width = scale * dimensions.width;
  const height = scale * dimensions.height;

  const canvas = document.createElement("canvas") as HTMLCanvasElement;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  context.drawImage(image, 0, 0, width, height);

  return canvas;
};

const findCategoryIndex = (
  categories: Category[],
  identifier: string
): number => {
  const labels = categories.filter(
    (category: Category) =>
      category.id !== "00000000-0000-0000-0000-000000000000"
  );
  return labels.findIndex((category: Category) => category.id === identifier);
};

export const tensorImageData = async (image: Image) => {
  const data = await ImageJS.Image.load(image.originalSrc);

  return tensorflow.tidy(() => {
    return tensorflow.browser
      .fromPixels(imageToSquare(data.getCanvas(), 224))
      .toFloat()
      .sub(tensorflow.scalar(127.5))
      .div(tensorflow.scalar(127.5))
      .reshape([1, 224, 224, 3]);
  });
};
