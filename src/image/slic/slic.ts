import { computeSLICSegmentation } from "./computeSLICSegmentation";
import { remapLabels } from "./remapLabels";

export const slic = (imageData: ImageData) => {
  const segmentation = computeSLICSegmentation(imageData);

  const segments = remapLabels(segmentation);

  return {
    image: new Uint8Array(imageData.data),
    segmentation: segmentation,
    segments: segments,
  };
};
