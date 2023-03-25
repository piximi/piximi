import { DataStoreSlice, Partition } from "types";

export const selectSegmenterValidationImages = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.images.entities).filter(
    (image) => image.partition === Partition.Validation
  );
};
