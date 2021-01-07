export const assignSuperpixelLabel = (
  im: Float32Array,
  segmentation: Int32Array,
  mcMap: Float32Array,
  msMap: Float32Array,
  distanceMap: Float32Array,
  centers: Float32Array,
  clusterParams: Float32Array,
  numRegionsX: number,
  numRegionsY: number,
  regionSize: any,
  imW: number,
  imH: number
) => {
  let x;
  let y;

  for (let i = 0; i < distanceMap.length; ++i) {
    distanceMap[i] = Infinity;
  }

  for (let region = 0; region < numRegionsX * numRegionsY; ++region) {
    const cx = Math.round(centers[region * 5]);
    const cy = Math.round(centers[region * 5 + 1]);

    for (
      y = Math.max(0, cy - regionSize);
      y < Math.min(imH, cy + regionSize);
      ++y
    ) {
      for (
        x = Math.max(0, cx - regionSize);
        x < Math.min(imW, cx + regionSize);
        ++x
      ) {
        const spatial = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        const dR = im[y * imW + x] - centers[5 * region + 2];
        const dG = im[imW * imH + y * imW + x] - centers[5 * region + 3];
        const dB = im[2 * imW * imH + y * imW + x] - centers[5 * region + 4];
        const appearance = dR * dR + dG * dG + dB * dB;

        const distance = Math.sqrt(
          appearance / clusterParams[region * 2] +
            spatial / clusterParams[region * 2 + 1]
        );

        if (distance < distanceMap[y * imW + x]) {
          distanceMap[y * imW + x] = distance;
          segmentation[y * imW + x] = region;
        }
      }
    }
  }

  for (y = 0; y < imH; ++y) {
    for (x = 0; x < imW; ++x) {
      if (clusterParams[segmentation[y * imW + x] * 2] < mcMap[y * imW + x]) {
        clusterParams[segmentation[y * imW + x] * 2] = mcMap[y * imW + x];
      }

      if (
        clusterParams[segmentation[y * imW + x] * 2 + 1] < msMap[y * imW + x]
      ) {
        clusterParams[segmentation[y * imW + x] * 2 + 1] = msMap[y * imW + x];
      }
    }
  }
};
