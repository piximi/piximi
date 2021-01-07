export const eliminateSmallRegions = (
  segmentation: Int32Array,
  minRegionSize: number,
  numPixels: number,
  imW: number,
  imH: number
) => {
  const cleaned = new Int32Array(numPixels);
  const segment = new Int32Array(numPixels);

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  let segmentSize;
  let label;
  let cleanedLabel;
  let numExpanded;
  let pixel;
  let x;
  let y;
  let xp;
  let yp;
  let direction;
  let neighbor;

  for (pixel = 0; pixel < numPixels; pixel++) {
    if (cleaned[pixel]) continue;

    label = segmentation[pixel];
    numExpanded = 0;
    segmentSize = 0;
    segment[segmentSize++] = pixel;

    cleanedLabel = label + 1;
    cleaned[pixel] = label + 1;
    x = pixel % imW;
    y = Math.floor(pixel / imW);

    for (direction = 0; direction < 4; direction++) {
      xp = x + dx[direction];
      yp = y + dy[direction];
      neighbor = xp + yp * imW;

      if (0 <= xp && xp < imW && 0 <= yp && yp < imH && cleaned[neighbor]) {
        cleanedLabel = cleaned[neighbor];
      }
    }

    while (numExpanded < segmentSize) {
      const open = segment[numExpanded++];

      x = open % imW;
      y = Math.floor(open / imW);

      for (direction = 0; direction < 4; ++direction) {
        xp = x + dx[direction];
        yp = y + dy[direction];
        neighbor = xp + yp * imW;

        if (
          0 <= xp &&
          xp < imW &&
          0 <= yp &&
          yp < imH &&
          cleaned[neighbor] === 0 &&
          segmentation[neighbor] === label
        ) {
          cleaned[neighbor] = label + 1;
          segment[segmentSize++] = neighbor;
        }
      }
    }

    if (segmentSize < minRegionSize) {
      while (segmentSize > 0) {
        cleaned[segment[--segmentSize]] = cleanedLabel;
      }
    }
  }

  for (pixel = 0; pixel < numPixels; ++pixel) {
    --cleaned[pixel];
  }

  for (let index = 0; index < numPixels; ++index) {
    segmentation[index] = cleaned[index];
  }
};
