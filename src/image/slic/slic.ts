import { computeSLICSegmentation } from "./computeSLICSegmentation";
import { remapLabels } from "./remapLabels";

export const slic = (
  imageData: ImageData,
  options: { regionSize?: number; minRegionSize?: number; callback?: any }
) => {
  const regionSize = Math.round(options.regionSize || 40);

  const minRegionSize = options.minRegionSize || (regionSize * regionSize) / 4;

  const opts = {
    callback: options.callback,
    minRegionSize: minRegionSize,
    regionSize: regionSize,
  };

  const segmentation = computeSLICSegmentation(imageData, opts);

  const numSegments = remapLabels(segmentation);

  if (opts.callback) {
    const rgbData = new Uint8Array(imageData.data);

    opts.callback({
      width: imageData.width,
      height: imageData.height,
      size: numSegments,
      indexMap: segmentation,
      rgbData: rgbData,
    });
  }

  return segmentation;
};
