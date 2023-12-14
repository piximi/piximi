import {
  Tensor1D,
  Tensor4D,
  moments,
  split,
  tidy,
  topk,
} from "@tensorflow/tfjs";
//TODO: Write tests
export const sortTensor = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const negativeTensor = tensor.mul(-1);
    const negativeOrdered = topk(negativeTensor, negativeTensor.size).values;
    const ordered = negativeOrdered.mul(-1);
    return ordered as Tensor1D;
  });
};

export const getTensorMedian = (
  tensor: Tensor1D,
  sorted?: boolean
): Tensor1D => {
  return tidy(() => {
    if (!sorted) tensor = sortTensor(tensor);
    const middle = tensor.size / 2;
    const medianLeft = tensor.slice(middle, 1);
    if (tensor.size % 2 === 0) {
      const medianRight = tensor.slice(middle + 1, 1);
      return medianLeft.add(medianRight).div(2);
    } else {
      return medianLeft;
    }
  });
};

export const getTensorPercentile = (
  tensor: Tensor1D,
  percentile: number,
  sorted?: boolean
): Tensor1D => {
  return tidy(() => {
    if (!sorted) tensor = sortTensor(tensor);
    const percentBelow = Math.floor(tensor.size * percentile);
    return topk(tensor, percentBelow).values.min();
  });
};

export const getTensorStdDev = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const variance = moments(tensor).variance;
    return variance.sqrt() as Tensor1D;
  });
};

export const getTensorMAD = (tensor: Tensor1D, sorted?: boolean): Tensor1D => {
  return tidy(() => {
    const median = getTensorMedian(tensor, sorted);
    const subtractedTensor = tensor.sub(median) as Tensor1D;
    const absSubtracted = subtractedTensor.abs();
    return getTensorMedian(absSubtracted);
  });
};

export const getChannelIntensityMeasurements = (
  tensor: Tensor1D
): Array<{
  key: string;
  value: number;
}> => {
  return tidy(() => {
    const sortedTensor = sortTensor(tensor);
    const total = tensor.sum().arraySync() as number;
    const max = tensor.max().arraySync() as number;
    const min = tensor.min().arraySync() as number;
    const mean = tensor.mean().arraySync() as number;
    const median = getTensorMedian(sortedTensor, true).arraySync()[0];
    const std = getTensorStdDev(sortedTensor).arraySync()[0];
    const mad = getTensorMAD(sortedTensor, true).arraySync()[0];
    const upperQuartile = getTensorPercentile(
      sortedTensor,
      0.25,
      true
    ).arraySync()[0];
    const lowerQuartile = getTensorPercentile(
      sortedTensor,
      0.75,
      true
    ).arraySync()[0];
    return [
      { key: "total", value: total },
      { key: "mean", value: mean },
      { key: "median", value: median },
      { key: "std", value: std },
      { key: "mad", value: mad },
      { key: "min", value: min },
      { key: "max", value: max },
      { key: "upperQuartile", value: upperQuartile },
      { key: "lowerQuartile", value: lowerQuartile },
    ];
  });
};

export const getImageIntensity = (
  imageTensor: Tensor4D
): Record<string, Record<string, Array<{ key: string; value: number }>>> => {
  const [planes, , , channels] = imageTensor.shape;

  const imagePlanes = split(imageTensor, planes, 0);

  const measurements: Record<
    string,
    Record<string, Array<{ key: string; value: number }>>
  > = {};

  for (let i = 0; i < planes; i++) {
    const planeChannels = split(imagePlanes[i], channels, 3);
    const channelMeasurements: Record<
      string,
      Array<{ key: string; value: number }>
    > = {};
    for (let j = 0; j < channels; j++) {
      const flattenedChannel = planeChannels[j].flatten();
      channelMeasurements[`Channel ${j}`] =
        getChannelIntensityMeasurements(flattenedChannel);
    }
    measurements[`Plane ${i}`] = channelMeasurements;
  }
  return measurements;
};
