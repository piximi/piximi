export const rgb2xyz = (rgba: Uint8ClampedArray, w: number, h: number) => {
  const xyz = new Float32Array(3 * w * h);
  const gamma = 2.2;

  for (let i = 0; i < w * h; i++) {
    let r = parseFloat(String(rgba[4 * i + 0])) * 0.00392156862;
    let g = parseFloat(String(rgba[4 * i + 1])) * 0.00392156862;
    let b = parseFloat(String(rgba[4 * i + 2])) * 0.00392156862;

    r = Math.pow(r, gamma);
    g = Math.pow(g, gamma);
    b = Math.pow(b, gamma);
    xyz[i] = r * 0.488718 + g * 0.31068 + b * 0.200602;
    xyz[i + w * h] = r * 0.176204 + g * 0.812985 + b * 0.0108109;
    xyz[i + 2 * w * h] = g * 0.0102048 + b * 0.989795;
  }

  return xyz;
};
