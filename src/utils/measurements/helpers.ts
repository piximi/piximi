import { Tensor1D, Tensor4D, moments, tidy, topk } from "@tensorflow/tfjs";

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

export const getMeasurement = (
  thingData: Tensor4D,
  measuredChannel: number,
  measurement: string
) => {
  const [planes, height, width, channels] = thingData.shape;
  const numPixels = planes * width * height;
  const squashedTensor = thingData.reshape([numPixels, channels]);
  const gatheredTensor = squashedTensor.gather([measuredChannel], 1);
  squashedTensor.dispose();
  const channelTensor = gatheredTensor.flatten();
  gatheredTensor.dispose();
  const sortedChannelTensor = sortTensor(channelTensor);

  let measurementResults: number | undefined = undefined;

  switch (measurement) {
    case "intensity-total":
      const total = channelTensor.sum().arraySync() as number;

      measurementResults = total;
      break;

    case "intensity-mean":
      const mean = channelTensor.mean().arraySync() as number;

      measurementResults = mean;
      break;

    case "intensity-median":
      const median = getTensorMedian(sortedChannelTensor, true).arraySync();

      measurementResults = Array.isArray(median) ? median[0] : median;
      break;

    case "intensity-std":
      const std = getTensorStdDev(sortedChannelTensor).arraySync();

      measurementResults = Array.isArray(std) ? std[0] : std;
      break;
    case "intensity-MAD":
      const mad = getTensorMAD(sortedChannelTensor, true).arraySync();

      measurementResults = Array.isArray(mad) ? mad[0] : mad;
      break;
    case "intensity-min":
      const min = channelTensor.min().arraySync() as number;

      measurementResults = min;
      break;
    case "intensity-max":
      const max = channelTensor.max().arraySync() as number;

      measurementResults = max;
      break;
    case "intensity-upper-quartile":
      const upperQuartile = getTensorPercentile(
        sortedChannelTensor,
        0.25,
        true
      ).arraySync();

      measurementResults = Array.isArray(upperQuartile)
        ? upperQuartile[0]
        : upperQuartile;
      break;
    case "intensity-lower-quartile":
      const lowerQuartile = getTensorPercentile(
        sortedChannelTensor,
        0.75,
        true
      ).arraySync();

      measurementResults = Array.isArray(lowerQuartile)
        ? lowerQuartile[0]
        : lowerQuartile;
      break;
    default:
      break;
  }
  channelTensor.dispose();
  sortedChannelTensor.dispose();
  return measurementResults;
};
