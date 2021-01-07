export const remapLabels = (segmentation: Int32Array) => {
  const map: { [key: number]: number } = {};

  let index = 0;

  for (let i = 0; i < segmentation.length; ++i) {
    const label = segmentation[i];

    if (map[label] === undefined) {
      map[label] = index++;
    }

    segmentation[i] = map[label];
  }

  return index;
};
