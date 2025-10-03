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
  TypedArray,
} from "@tensorflow/tfjs";
import { intersection } from "lodash";
import { MeasurementOption } from "store/measurements/types";
import { findContours } from "views/ImageViewer/utils";
import { DataArray } from "store/data/types";

/**
 * Sorts a 1D tensor in ascending order using TensorFlow operations.
 * Uses the trick of negating, finding top-k (which gives descending order), then negating again.
 * @param tensor - 1D tensor to sort
 * @returns Sorted tensor in ascending order
 */
//TODO: Write tests
const sortTensor = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const negativeTensor = tensor.mul(-1);
    const negativeOrdered = topk(negativeTensor, negativeTensor.size).values;
    const ordered = negativeOrdered.mul(-1);
    return ordered as Tensor1D;
  });
};

/**
 * Calculates the median value of a 1D tensor.
 * For even-sized tensors, returns the average of the two middle values.
 * @param tensor - 1D tensor to calculate median from
 * @param sorted - Whether the tensor is already sorted (optimization flag)
 * @returns Tensor containing the median value
 */
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

/**
 * Calculates a specific percentile value from a 1D tensor.
 * @param tensor - 1D tensor to calculate percentile from
 * @param percentile - Percentile to calculate (0-1, e.g., 0.25 for 25th percentile)
 * @param sorted - Whether the tensor is already sorted (optimization flag)
 * @returns Tensor containing the percentile value
 */
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

/**
 * Calculates the standard deviation of a 1D tensor.
 * @param tensor - 1D tensor to calculate standard deviation from
 * @returns Tensor containing the standard deviation value
 */
const getTensorStdDev = (tensor: Tensor1D): Tensor1D => {
  return tidy(() => {
    const variance = moments(tensor).variance;
    return variance.sqrt() as Tensor1D;
  });
};

/**
 * Calculates the Median Absolute Deviation (MAD) of a 1D tensor.
 * MAD is a robust measure of variability, calculated as the median of absolute deviations from the median.
 * @param tensor - 1D tensor to calculate MAD from
 * @param sorted - Whether the tensor is already sorted (optimization flag)
 * @returns Tensor containing the MAD value
 */
const getTensorMAD = (tensor: Tensor1D, sorted?: boolean): Tensor1D => {
  return tidy(() => {
    const median = getTensorMedian(tensor, sorted);
    const subtractedTensor = tensor.sub(median) as Tensor1D;
    const absSubtracted = subtractedTensor.abs();
    return getTensorMedian(absSubtracted);
  });
};

/**
 * Reshapes 4D image tensor into a 2D tensor organized by channels.
 * Transforms from [planes, height, width, channels] to [channels, pixels],
 * making it easier to perform measurements on each channel independently.
 * @param thingData - 4D tensor containing image data
 * @returns 2D tensor where each row represents all pixel values for one channel
 */
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
/**
 * Calculates various intensity measurements (statistics) on a single channel's pixel data.
 * Supports: total, mean, median, standard deviation, MAD, min, max, and quartiles.
 * @param channelTensor - 1D tensor containing pixel intensity values for one channel
 * @param measurement - Type of measurement to calculate (e.g., "intensity-mean", "intensity-median")
 * @returns Calculated measurement value, or undefined if measurement type is unknown
 */
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

/**
 * Filters channel data to include only pixels within a specified object mask.
 * Used to measure properties of specific objects/regions rather than entire images.
 * @param channelData - 2D tensor of channel data [channels, pixels]
 * @param objectMask - Binary mask indicating which pixels belong to the object
 * @returns 2D tensor containing only the masked pixel values for each channel
 */
export const getObjectMaskData = async (
  channelData: Tensor2D,
  objectMask: DataArray,
) => {
  //const maskArray = Array.from(objectMask);
  const maskTensor = tensor1d(objectMask as TypedArray, "bool");

  const maskedChannels = await booleanMaskAsync(channelData, maskTensor, 1);
  maskTensor.dispose();
  return maskedChannels as Tensor2D;
};

/**
 * Calculates the total perimeter of an object from its binary mask.
 * Finds contours in the mask and sums the perimeters of all contours.
 * @param mask - Binary mask data representing the object
 * @param maskShape - Dimensions of the mask (width and height)
 * @returns Total perimeter length in pixels
 */
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

/**
 * Calculates perimeter by summing Euclidean distances between consecutive vertices.
 * Closes the polygon by connecting the last vertex back to the first.
 * @param vertices - Array of [x, y] coordinate pairs representing the contour
 * @returns Total perimeter length
 */
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
/**
 * Calculates the Equivalent Circular Diameter (EQPC) - the diameter of a circle with the same area.
 * @param area - Area of the object
 * @returns Diameter of equivalent circle
 */
export const getEQPC = (area: number) => {
  return 2 * Math.sqrt(area / Math.PI);
};

/**
 * Calculates the perimeter of a circle with the given area (PEQPC).
 * @param area - Area of the object
 * @returns Perimeter of equivalent circle
 */
const getPEQPC = (area: number) => {
  return 2 * Math.sqrt(area * Math.PI);
};

/**
 * Calculates the form factor (circularity) of an object.
 * Form factor = (perimeter of equivalent circle) / (actual perimeter)
 * A perfect circle has a form factor of 1; irregular shapes have values < 1.
 * @param area - Area of the object
 * @param maskData - Binary mask of the object
 * @param maskShape - Dimensions of the mask
 * @returns Form factor value (0-1, where 1 is perfectly circular)
 */
export const getObjectFormFactor = (
  area: number,
  maskData: DataArray,
  maskShape: { width: number; height: number },
) => {
  const peqpc = getPEQPC(area);

  const per = getPerimeterFromMask(maskData, maskShape);

  return peqpc / per;
};

/**
 * Recursively determines which parent measurement options should be selected
 * based on their children's selection state. If all children of a parent are selected,
 * the parent is automatically selected as well.
 * @param parents - Array of parent measurement options to check
 * @param selectedMeasurements - Array of currently selected measurement IDs (modified in place)
 */
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

/**
 * Calculates the arithmetic mean (average) of an array of numbers.
 * @param values - Array of numerical values
 * @returns Mean value
 */
export const getMean = (values: number[]) => {
  return (
    values.reduce((sum: number, value) => {
      return sum + value;
    }, 0) / values.length
  );
};

/**
 * Calculates the median value from an array of numbers.
 * For even-length arrays, returns the average of the two middle values.
 * @param values - Array of numerical values (should be sorted)
 * @returns Object containing the median value and its index
 */
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

/**
 * Calculates the standard deviation of an array of numbers.
 * @param values - Array of numerical values
 * @param mean - Pre-calculated mean of the values (for efficiency)
 * @returns Standard deviation
 */
const getSTD = (values: number[], mean: number) => {
  const _std =
    values.reduce((sqsum: number, value) => {
      return sqsum + (value - mean) ** 2;
    }, 0) / values.length;

  return Math.sqrt(_std);
};

/**
 * Computes comprehensive statistics for an array of values.
 * Calculates mean, median, standard deviation, min, max, and quartiles.
 * @param values - Array of numerical values
 * @returns Object containing all calculated statistics
 */
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

/**
 * Comparison function for sorting decimal numbers in ascending order.
 * @param a - First number
 * @param b - Second number
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareDecimals(a: number, b: number) {
  if (a === b) return 0;

  return a < b ? -1 : 1;
}
