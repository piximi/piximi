export const getObjectArea = (encodedMask: number[]) => {
  let sum = 0;
  encodedMask.forEach((val, idx) => {
    if (idx % 2 !== 0) {
      sum += val;
    }
  });
  return sum;
};
