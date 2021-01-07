import { computeSegmentation } from "./computeSegmentation";

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

  return computeSegmentation(imageData, opts);
};
