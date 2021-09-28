import { Image } from "../../../types/Image";

export const rescaleData = async (
  lowerPercentile: number,
  upperPercentile: number,
  labeledData: Image[]
) => {
  // do something
  // old :const testDataSet = await createLabledTensorflowDataSet(testData, categories);
  let rescaledSet;
  return { rescaledSet };
};

export const resizeData = async (
  paddingOption1: boolean,
  paddingOption2: boolean,
  labeledData: Image[]
) => {
  // do something
  let resizedSet;
  return { resizedSet };
};

export const augmentData = async (
  dataAugmentation: boolean,
  labeledData: Image[]
) => {
  // do something
  // old :const testDataSet = await createLabledTensorflowDataSet(testData, categories);
  let augmentedSet;
  return { augmentedSet };
};
