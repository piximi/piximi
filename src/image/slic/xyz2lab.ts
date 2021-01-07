export const xyz2lab = (xyz: Float32Array | number[], w: number, h: number) => {
  const f = (x: number) => {
    if (x > 0.00856) {
      return Math.pow(x, 0.33333333);
    } else {
      return 7.78706891568 * x + 0.1379310336;
    }
  };

  const xw = 1.0 / 3.0;
  const yw = 1.0 / 3.0;
  const Yw = 1.0;
  const Xw = xw / yw;
  const Zw = ((1 - xw - yw) / yw) * Yw;
  const ix = 1.0 / Xw;
  const iy = 1.0 / Yw;
  const iz = 1.0 / Zw;
  const labData = new Float32Array(3 * w * h);

  for (let i = 0; i < w * h; i++) {
    const fx = f(xyz[i] * ix);
    const fy = f(xyz[w * h + i] * iy);
    const fz = f(xyz[2 * w * h + i] * iz);

    labData[i] = 116.0 * fy - 16.0;
    labData[i + w * h] = 500.0 * (fx - fy);
    labData[i + 2 * w * h] = 200.0 * (fy - fz);
  }

  return labData;
};
