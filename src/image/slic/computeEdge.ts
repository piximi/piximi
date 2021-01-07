export const computeEdge = (
  image: Float32Array | number[],
  edgeMap: Float32Array | number[],
  w: number,
  h: number
) => {
  for (let k = 0; k < 3; k++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const a = image[k * w * h + y * w + x - 1];
        const b = image[k * w * h + y * w + x + 1];
        const c = image[k * w * h + (y + 1) * w + x];
        const d = image[k * w * h + (y - 1) * w + x];

        edgeMap[y * w + x] =
          edgeMap[y * w + x] + (a - b) * (a - b) + (c - d) * (c - d);
      }
    }
  }
};
