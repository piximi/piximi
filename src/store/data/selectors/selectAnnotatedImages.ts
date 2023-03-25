import { DataStoreSlice } from "types";
export const selectAnnotatedImages = ({ data }: { data: DataStoreSlice }) => {
  const images = [];
  for (const imageId in data.annotationsByImage) {
    if (data.annotationsByImage[imageId].length) {
      images.push(data.images.entities[imageId]);
    }
  }

  return images;
};
