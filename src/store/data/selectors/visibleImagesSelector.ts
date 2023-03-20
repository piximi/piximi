import { DataStoreSlice } from "types";

export const visibleImagesSelector = ({ data }: { data: DataStoreSlice }) => {
  const visibleImages = [];
  for (const catId of data.categories.ids) {
    if (data.categories.entities[catId].visible) {
      for (const imageId in data.lookup[catId]) {
        const image = data.images.entities[imageId];
        if (image.visible) {
          visibleImages.push(image);
        }
      }
    }
  }
  return visibleImages;
};
