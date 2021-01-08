import { computeSLICSegmentation } from "./computeSLICSegmentation";
import { remapLabels } from "./remapLabels";

export const slic = (imageData: ImageData, size: number = 40) => {
  const segmentation = computeSLICSegmentation(imageData, size);

  return {
    image: new Uint8Array(imageData.data),
    segmentation: segmentation,
  };
};
