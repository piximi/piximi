export const computeCenters = (
  image: Float32Array,
  segmentation: Int32Array,
  masses: Array<number>,
  centers: Float32Array,
  numRegions: number,
  imW: number,
  imH: number
) => {
  let region;

  for (let y = 0; y < imH; y++) {
    for (let x = 0; x < imW; x++) {
      region = segmentation[x + y * imW];

      masses[region]++;

      centers[region * 5] += x;
      centers[region * 5 + 1] += y;
      centers[region * 5 + 2] += image[y * imW + x];
      centers[region * 5 + 3] += image[imW * imH + y * imW + x];
      centers[region * 5 + 4] += image[2 * imW * imH + y * imW + x];
    }
  }

  for (region = 0; region < numRegions; region++) {
    const iMass = 1.0 / Math.max(masses[region], 1e-8);

    centers[region * 5] = centers[region * 5] * iMass;
    centers[region * 5 + 1] = centers[region * 5 + 1] * iMass;
    centers[region * 5 + 2] = centers[region * 5 + 2] * iMass;
    centers[region * 5 + 3] = centers[region * 5 + 3] * iMass;
    centers[region * 5 + 4] = centers[region * 5 + 4] * iMass;
  }
};
