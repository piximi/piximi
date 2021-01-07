import { computeResidualError } from "./computeResidualError";
import { rgb2xyz } from "./rgb2xyz";
import { xyz2lab } from "./xyz2lab";

export const computeSLICSegmentation = (
  imageData: ImageData,
  options: { callback?: any; regionSize: number; minRegionSize: number }
) => {
  const imWidth = imageData.width;
  const imHeight = imageData.height;
  const numRegionsX = parseInt(String(imWidth / options.regionSize), 10);
  const numRegionsY = parseInt(String(imHeight / options.regionSize), 10);
  const numRegions = parseInt(String(numRegionsX * numRegionsY), 10);
  const numPixels = parseInt(String(imWidth * imHeight), 10);
  const regionSize = options.regionSize;
  const masses = new Array(numPixels);
  const currentCenters = new Float32Array((2 + 3) * numRegions);
  const newCenters = new Float32Array((2 + 3) * numRegions);
  const clusterParams = new Float32Array(2 * numRegions);
  const mcMap = new Float32Array(numPixels);
  const msMap = new Float32Array(numPixels);
  const distanceMap = new Float32Array(numPixels);

  const labData = xyz2lab(
    rgb2xyz(imageData.data, imageData.width, imageData.height),
    imageData.width,
    imageData.height
  );

  /*
   * Compute gradient
   */
  const gradient = new Float32Array(numPixels);

  for (let k = 0; k < 3; k++) {
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const a =
          labData[
            k * imageData.width * imageData.height + y * imageData.width + x - 1
          ];
        const b =
          labData[
            k * imageData.width * imageData.height + y * imageData.width + x + 1
          ];
        const c =
          labData[
            k * imageData.width * imageData.height +
              (y + 1) * imageData.width +
              x
          ];
        const d =
          labData[
            k * imageData.width * imageData.height +
              (y - 1) * imageData.width +
              x
          ];

        gradient[y * imageData.width + x] =
          gradient[y * imageData.width + x] +
          (a - b) * (a - b) +
          (c - d) * (c - d);
      }
    }
  }

  /*
   * Initialize k-means centroids
   */
  let i = 0;
  let j = 0;

  for (let v = 0; v < numRegionsY; v++) {
    for (let u = 0; u < numRegionsX; u++) {
      let centerx = 0;
      let centery = 0;
      let minEdgeValue = Infinity;

      let x = parseInt(String(Math.round(regionSize * (u + 0.5))), 10);
      let y = parseInt(String(Math.round(regionSize * (v + 0.5))), 10);

      x = Math.max(Math.min(x, imageData.width - 1), 0);
      y = Math.max(Math.min(y, imageData.height - 1), 0);

      for (
        let yp = Math.max(0, y - 1);
        yp <= Math.min(imageData.height - 1, y + 1);
        yp++
      ) {
        for (
          let xp = Math.max(0, x - 1);
          xp <= Math.min(imageData.width - 1, x + 1);
          xp++
        ) {
          const thisEdgeValue = gradient[yp * imageData.width + xp];

          if (thisEdgeValue < minEdgeValue) {
            minEdgeValue = thisEdgeValue;
            centerx = xp;
            centery = yp;
          }
        }
      }

      currentCenters[i++] = parseFloat(String(centerx));
      currentCenters[i++] = parseFloat(String(centery));

      currentCenters[i++] = labData[centery * imageData.width + centerx];
      currentCenters[i++] =
        labData[
          imageData.width * imageData.height +
            centery * imageData.width +
            centerx
        ];
      currentCenters[i++] =
        labData[
          2 * imageData.width * imageData.height +
            centery * imageData.width +
            centerx
        ];

      clusterParams[j++] = 10 * 10;
      clusterParams[j++] = regionSize * regionSize;
    }
  }

  const iterations = 10;

  const segmentation = new Int32Array(numPixels);

  for (let iteration = 0; iteration < iterations; ++iteration) {
    /*
     * Label
     */
    for (let i1 = 0; i1 < distanceMap.length; ++i1) {
      distanceMap[i1] = Infinity;
    }

    for (let region = 0; region < numRegionsX * numRegionsY; ++region) {
      const cx = Math.round(currentCenters[region * 5]);
      const cy = Math.round(currentCenters[region * 5 + 1]);

      for (
        let y2 = Math.max(0, cy - regionSize);
        y2 < Math.min(imageData.height, cy + regionSize);
        ++y2
      ) {
        for (
          let x2 = Math.max(0, cx - regionSize);
          x2 < Math.min(imageData.width, cx + regionSize);
          ++x2
        ) {
          const spatial = (x2 - cx) * (x2 - cx) + (y2 - cy) * (y2 - cy);
          const dR =
            labData[y2 * imageData.width + x2] - currentCenters[5 * region + 2];
          const dG =
            labData[
              imageData.width * imageData.height + y2 * imageData.width + x2
            ] - currentCenters[5 * region + 3];
          const dB =
            labData[
              2 * imageData.width * imageData.height + y2 * imageData.width + x2
            ] - currentCenters[5 * region + 4];
          const appearance = dR * dR + dG * dG + dB * dB;

          const distance = Math.sqrt(
            appearance / clusterParams[region * 2] +
              spatial / clusterParams[region * 2 + 1]
          );

          if (distance < distanceMap[y2 * imageData.width + x2]) {
            distanceMap[y2 * imageData.width + x2] = distance;
            segmentation[y2 * imageData.width + x2] = region;
          }
        }
      }
    }

    for (let y2 = 0; y2 < imageData.height; ++y2) {
      for (let x2 = 0; x2 < imageData.width; ++x2) {
        if (
          clusterParams[segmentation[y2 * imageData.width + x2] * 2] <
          mcMap[y2 * imageData.width + x2]
        ) {
          clusterParams[segmentation[y2 * imageData.width + x2] * 2] =
            mcMap[y2 * imageData.width + x2];
        }

        if (
          clusterParams[segmentation[y2 * imageData.width + x2] * 2 + 1] <
          msMap[y2 * imageData.width + x2]
        ) {
          clusterParams[segmentation[y2 * imageData.width + x2] * 2 + 1] =
            msMap[y2 * imageData.width + x2];
        }
      }
    }

    /*
     * Update parameters
     */
    const mc = new Float32Array(clusterParams.length / 2);
    const ms = new Float32Array(clusterParams.length / 2);

    for (let i1 = 0; i1 < segmentation.length; i1++) {
      const region = segmentation[i1];

      if (mc[region] < mcMap[region]) {
        mc[region] = mcMap[region];

        clusterParams[region * 2] = mcMap[region];
      }

      if (ms[region] < msMap[region]) {
        ms[region] = msMap[region];

        clusterParams[region * 2 + 1] = msMap[region];
      }
    }

    for (let i = 0; i < masses.length; ++i) {
      masses[i] = 0;
    }

    for (let i = 0; i < newCenters.length; ++i) {
      newCenters[i] = 0;
    }

    /*
     * Compute centroids
     */
    let region;

    for (let y1 = 0; y1 < imageData.height; y1++) {
      for (let x1 = 0; x1 < imageData.width; x1++) {
        region = segmentation[x1 + y1 * imageData.width];

        masses[region]++;

        newCenters[region * 5] += x1;
        newCenters[region * 5 + 1] += y1;
        newCenters[region * 5 + 2] += labData[y1 * imageData.width + x1];
        newCenters[region * 5 + 3] +=
          labData[
            imageData.width * imageData.height + y1 * imageData.width + x1
          ];
        newCenters[region * 5 + 4] +=
          labData[
            2 * imageData.width * imageData.height + y1 * imageData.width + x1
          ];
      }
    }

    for (region = 0; region < numRegions; region++) {
      const iMass = 1.0 / Math.max(masses[region], 1e-8);

      newCenters[region * 5] = newCenters[region * 5] * iMass;
      newCenters[region * 5 + 1] = newCenters[region * 5 + 1] * iMass;
      newCenters[region * 5 + 2] = newCenters[region * 5 + 2] * iMass;
      newCenters[region * 5 + 3] = newCenters[region * 5 + 3] * iMass;
      newCenters[region * 5 + 4] = newCenters[region * 5 + 4] * iMass;
    }

    const error = computeResidualError(currentCenters, newCenters);

    if (error < 1e-5) {
      break;
    }

    for (let i = 0; i < currentCenters.length; ++i) {
      currentCenters[i] = newCenters[i];
    }
  }

  /*
   * Remove small objects
   */
  const cleaned = new Int32Array(numPixels);
  const segment = new Int32Array(numPixels);

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  let segmentSize;
  let label;
  let cleanedLabel;
  let numExpanded;
  let x1;
  let y1;
  let xp;
  let yp;
  let neighbor;

  for (let pixel = 0; pixel < numPixels; pixel++) {
    if (cleaned[pixel]) continue;

    label = segmentation[pixel];
    numExpanded = 0;
    segmentSize = 0;
    segment[segmentSize++] = pixel;

    cleanedLabel = label + 1;
    cleaned[pixel] = label + 1;
    x1 = pixel % imageData.width;
    y1 = Math.floor(pixel / imageData.width);

    for (let direction = 0; direction < 4; direction++) {
      xp = x1 + dx[direction];
      yp = y1 + dy[direction];
      neighbor = xp + yp * imageData.width;

      if (
        0 <= xp &&
        xp < imageData.width &&
        0 <= yp &&
        yp < imageData.height &&
        cleaned[neighbor]
      ) {
        cleanedLabel = cleaned[neighbor];
      }
    }

    while (numExpanded < segmentSize) {
      const open = segment[numExpanded++];

      x1 = open % imageData.width;
      y1 = Math.floor(open / imageData.width);

      for (let direction = 0; direction < 4; ++direction) {
        xp = x1 + dx[direction];
        yp = y1 + dy[direction];
        neighbor = xp + yp * imageData.width;

        if (
          0 <= xp &&
          xp < imageData.width &&
          0 <= yp &&
          yp < imageData.height &&
          cleaned[neighbor] === 0 &&
          segmentation[neighbor] === label
        ) {
          cleaned[neighbor] = label + 1;
          segment[segmentSize++] = neighbor;
        }
      }
    }

    if (segmentSize < options.minRegionSize) {
      while (segmentSize > 0) {
        cleaned[segment[--segmentSize]] = cleanedLabel;
      }
    }
  }

  for (let pixel = 0; pixel < numPixels; ++pixel) {
    --cleaned[pixel];
  }

  for (let index = 0; index < numPixels; ++index) {
    segmentation[index] = cleaned[index];
  }

  return segmentation;
};
