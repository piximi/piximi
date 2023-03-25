import { DataStoreSlice, Partition } from "types";

export const selectTrainingImages = ({ data }: { data: DataStoreSlice }) => {
  return Object.values(data.images.entities).filter(
    (image) => image.partition === Partition.Training
  );
};
