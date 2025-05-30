import {
  Tensor1D,
  Tensor4D,
  moments,
  tidy,
  topk,
  stack,
  Tensor2D,
  tensor1d,
  booleanMaskAsync,
} from "@tensorflow/tfjs";
import { intersection } from "lodash";
import { MeasurementOption } from "store/measurements/types";
import { findContours } from "views/ImageViewer/utils";
import { DataArray } from "store/data/types";

//TODO: Write tests
const sortTensor = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const negativeTensor = tensor.mul(-1);
    const negativeOrdered = topk(negativeTensor, negativeTensor.size).values;
    const ordered = negativeOrdered.mul(-1);
    return ordered as Tensor1D;
  });
};

const getTensorMedian = (tensor: Tensor1D, sorted?: boolean): Tensor1D => {
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

const getTensorPercentile = (
  tensor: Tensor1D,
  percentile: number,
  sorted?: boolean,
): Tensor1D => {
  return tidy(() => {
    if (!sorted) tensor = sortTensor(tensor);
    const percentBelow = Math.floor(tensor.size * percentile);

    return topk(tensor, percentBelow).values.min();
  });
};

const getTensorStdDev = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const variance = moments(tensor).variance;
    return variance.sqrt() as Tensor1D;
  });
};

const getTensorMAD = (tensor: Tensor1D, sorted?: boolean): Tensor1D => {
  return tidy(() => {
    const median = getTensorMedian(tensor, sorted);
    const subtractedTensor = tensor.sub(median) as Tensor1D;
    const absSubtracted = subtractedTensor.abs();
    return getTensorMedian(absSubtracted);
  });
};

export const prepareChannels = (thingData: Tensor4D) => {
  return tidy(() => {
    const [planes, height, width, channels] = thingData.shape;
    const numPixels = planes * width * height;
    const squashedTensor = thingData.reshape([numPixels, channels]);

    const channelTensors: Array<Tensor1D> = [];
    for (let i = 0; i < channels; i++) {
      const gatheredTensor = squashedTensor.gather([i], 1);
      const channelTensor = gatheredTensor.flatten();
      channelTensors.push(channelTensor);
    }

    return stack(channelTensors) as Tensor2D;
  });
};
export const getIntensityMeasurement = (
  channelTensor: Tensor1D,
  measurement: string,
) => {
  const sortedChannelTensor = sortTensor(channelTensor);

  let measurementResults: number | undefined = undefined;

  switch (measurement) {
    case "intensity-total":
      const total = tidy(() => {
        return channelTensor.sum().arraySync() as number;
      });

      measurementResults = total;
      break;

    case "intensity-mean":
      const mean = tidy(() => {
        return channelTensor.mean().arraySync() as number;
      });

      measurementResults = mean;
      break;

    case "intensity-median":
      const median = tidy(() => {
        return getTensorMedian(sortedChannelTensor, true).arraySync();
      });

      measurementResults = Array.isArray(median) ? median[0] : median;
      break;

    case "intensity-std":
      const std = tidy(() => {
        return getTensorStdDev(sortedChannelTensor).arraySync();
      });

      measurementResults = Array.isArray(std) ? std[0] : std;
      break;
    case "intensity-MAD":
      const mad = tidy(() => {
        return getTensorMAD(sortedChannelTensor, true).arraySync();
      });

      measurementResults = Array.isArray(mad) ? mad[0] : mad;
      break;
    case "intensity-min":
      const min = tidy(() => {
        return channelTensor.min().arraySync() as number;
      });

      measurementResults = min;
      break;
    case "intensity-max":
      const max = tidy(() => {
        return channelTensor.max().arraySync() as number;
      });

      measurementResults = max;
      break;
    case "intensity-upper-quartile":
      const upperQuartile = tidy(() => {
        return getTensorPercentile(sortedChannelTensor, 0.25, true).arraySync();
      });

      measurementResults = Array.isArray(upperQuartile)
        ? upperQuartile[0]
        : upperQuartile;
      break;
    case "intensity-lower-quartile":
      const lowerQuartile = tidy(() => {
        return getTensorPercentile(sortedChannelTensor, 0.75, true).arraySync();
      });

      measurementResults = Array.isArray(lowerQuartile)
        ? lowerQuartile[0]
        : lowerQuartile;
      break;
    default:
      break;
  }
  sortedChannelTensor.dispose();
  return measurementResults;
};

export const getObjectMaskData = async (
  channelData: Tensor2D,
  objectMask: DataArray,
) => {
  const maskArray = Array.from(objectMask);
  const maskTensor = tensor1d(maskArray, "bool");

  const maskedChannels = await booleanMaskAsync(channelData, maskTensor, 1);
  maskTensor.dispose();
  return maskedChannels as Tensor2D;
};

export const getPerimeterFromMask = (
  mask: DataArray,
  maskShape: { width: number; height: number },
) => {
  const nMask: number[] = [];
  Array.from(mask).forEach((i) => {
    nMask.push(i / 255);
  });
  const contourArray = findContours(
    Int8Array.from(nMask),
    maskShape.width,
    maskShape.height,
  );
  return contourArray.reduce((perimeter: number, contour) => {
    return (
      perimeter +
      getPerimeter(contour.points.map((point) => [point.x, point.y]))
    );
  }, 0);
};

const getPerimeter = (vertices: Array<Array<number>>) => {
  let total = 0;
  for (let i = 0; i < vertices.length; i++) {
    const fromX = vertices[i][0];
    const fromY = vertices[i][1];
    const toX = vertices[i === vertices.length - 1 ? 0 : i + 1][0];
    const toY = vertices[i === vertices.length - 1 ? 0 : i + 1][1];
    total += Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
  }
  return total;
};
export const getEQPC = (area: number) => {
  return 2 * Math.sqrt(area / Math.PI);
};
const getPEQPC = (area: number) => {
  return 2 * Math.sqrt(area * Math.PI);
};

export const getObjectFormFactor = (
  area: number,
  maskData: DataArray,
  maskShape: { width: number; height: number },
) => {
  const peqpc = getPEQPC(area);

  const per = getPerimeterFromMask(maskData, maskShape);

  return peqpc / per;
};

export const findSelected = (
  parents: MeasurementOption[],
  selectedMeasurements: string[],
) => {
  parents.forEach((parent) => {
    const containedChildren = intersection(
      parent.children!,
      selectedMeasurements,
    );
    if (
      containedChildren.length === parent.children!.length &&
      !selectedMeasurements.includes(parent.id)
    ) {
      selectedMeasurements.push(parent.id);
      findSelected(parents, selectedMeasurements);
    }
  });
};

export const getMean = (values: number[]) => {
  return (
    values.reduce((sum: number, value) => {
      return sum + value;
    }, 0) / values.length
  );
};

const getMedian = (values: number[]) => {
  const middleIndex = values.length / 2;
  const flooredIndex = Math.floor(middleIndex);
  let median: number;
  if (flooredIndex === middleIndex) {
    median = (values[middleIndex - 1] + values[middleIndex]) / 2;
  } else {
    median = values[flooredIndex];
  }
  return { median, index: flooredIndex };
};

const getSTD = (values: number[], mean: number) => {
  const _std =
    values.reduce((sqsum: number, value) => {
      return sqsum + (value - mean) ** 2;
    }, 0) / values.length;

  return Math.sqrt(_std);
};

export const getStatistics = (values: number[]) => {
  const sortedValues = [...values];
  sortedValues.sort(compareDecimals);
  const mean = getMean(sortedValues);
  const { median, index } = getMedian(sortedValues);
  const std = getSTD(sortedValues, mean);
  const lowerHalf = sortedValues.slice(0, index);
  const upperHalf = sortedValues.slice(index);
  const { median: lowerQuartile } = getMedian(lowerHalf);
  const { median: upperQuartile } = getMedian(upperHalf);
  const max = sortedValues.at(-1)!;
  const min = sortedValues[0];

  return { mean, median, std, min, max, lowerQuartile, upperQuartile };
};

function compareDecimals(a: number, b: number) {
  if (a === b) return 0;

  return a < b ? -1 : 1;
}
