export const computeResidualError = (
  previous: Float32Array,
  current: Float32Array
) => {
  let error = 0.0;

  for (let index = 0; index < previous.length; ++index) {
    const d = previous[index] - current[index];

    error += Math.sqrt(d * d);
  }

  return error;
};
