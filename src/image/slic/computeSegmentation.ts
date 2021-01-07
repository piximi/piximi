import { computeSLICSegmentation } from "./computeSLICSegmentation";
import { remapLabels } from "./remapLabels";

export const computeSegmentation = (
  imageData: ImageData,
  options: { callback?: any; regionSize: number; minRegionSize: number }
) => {
  const segmentation = computeSLICSegmentation(imageData, options);
  const numSegments = remapLabels(segmentation);

  if (options.callback) {
    const rgbData = new Uint8Array(imageData.data);

    options.callback({
      width: imageData.width,
      height: imageData.height,
      size: numSegments,
      indexMap: segmentation,
      rgbData: rgbData,
    });
  }
};
