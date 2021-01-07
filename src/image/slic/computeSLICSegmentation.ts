import { assignSuperpixelLabel } from "./assignSuperpixelLabel";
import { computeCenters } from "./computeCenters";
import { computeEdge } from "./computeEdge";
import { computeResidualError } from "./computeResidualError";
import { eliminateSmallRegions } from "./eliminateSmallRegions";
import { initializeKmeansCenters } from "./initializeKmeansCenters";
import { rgb2xyz } from "./rgb2xyz";
import { updateClusterParams } from "./updateClusterParams";
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
  const edgeMap = new Float32Array(numPixels);
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

  computeEdge(labData, edgeMap, imageData.width, imageData.height);

  initializeKmeansCenters(
    labData,
    edgeMap,
    currentCenters,
    clusterParams,
    numRegionsX,
    numRegionsY,
    regionSize,
    imageData.width,
    imageData.height
  );

  const maxNumIterations = 10;
  const segmentation = new Int32Array(numPixels);

  for (let iter = 0; iter < maxNumIterations; ++iter) {
    assignSuperpixelLabel(
      labData,
      segmentation,
      mcMap,
      msMap,
      distanceMap,
      currentCenters,
      clusterParams,
      numRegionsX,
      numRegionsY,
      regionSize,
      imageData.width,
      imageData.height
    );

    updateClusterParams(segmentation, mcMap, msMap, clusterParams);

    for (let i = 0; i < masses.length; ++i) {
      masses[i] = 0;
    }

    for (let i = 0; i < newCenters.length; ++i) {
      newCenters[i] = 0;
    }

    computeCenters(
      labData,
      segmentation,
      masses,
      newCenters,
      numRegions,
      imageData.width,
      imageData.height
    );

    const error = computeResidualError(currentCenters, newCenters);

    if (error < 1e-5) {
      break;
    }

    for (let i = 0; i < currentCenters.length; ++i) {
      currentCenters[i] = newCenters[i];
    }
  }

  eliminateSmallRegions(
    segmentation,
    options.minRegionSize,
    numPixels,
    imageData.width,
    imageData.height
  );

  return segmentation;
};
