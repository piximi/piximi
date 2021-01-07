export const updateClusterParams = (
  segmentation: Int32Array,
  mcMap: Float32Array,
  msMap: Float32Array,
  clusterParams: Float32Array
) => {
  const mc = new Float32Array(clusterParams.length / 2);
  const ms = new Float32Array(clusterParams.length / 2);

  for (let i = 0; i < segmentation.length; i++) {
    const region = segmentation[i];

    if (mc[region] < mcMap[region]) {
      mc[region] = mcMap[region];

      clusterParams[region * 2] = mcMap[region];
    }

    if (ms[region] < msMap[region]) {
      ms[region] = msMap[region];

      clusterParams[region * 2 + 1] = msMap[region];
    }
  }
};
