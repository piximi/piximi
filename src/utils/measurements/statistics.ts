export const computeMean = (values: number[]) => {
  return (
    values.reduce((sum: number, value) => {
      return sum + value;
    }, 0) / values.length
  );
};

const computeMedian = (values: number[]) => {
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

const computeSTD = (values: number[], mean: number) => {
  const _std =
    values.reduce((sqsum: number, value) => {
      return sqsum + (value - mean) ** 2;
    }, 0) / values.length;

  return Math.sqrt(_std);
};

export const computeStatistics = (values: number[]) => {
  const sortedValues = [...values];
  sortedValues.sort(compareDecimals);
  const mean = computeMean(sortedValues);
  const { median, index } = computeMedian(sortedValues);
  const std = computeSTD(sortedValues, mean);
  const lowerHalf = sortedValues.slice(0, index);
  const upperHalf = sortedValues.slice(index);
  const { median: lowerQuartile } = computeMedian(lowerHalf);
  const { median: upperQuartile } = computeMedian(upperHalf);
  const max = sortedValues.at(-1)!;
  const min = sortedValues[0];

  return { mean, median, std, min, max, lowerQuartile, upperQuartile };
};

function compareDecimals(a: number, b: number) {
  if (a === b) return 0;

  return a < b ? -1 : 1;
}
