import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/annotator";
import { DataStoreSlice } from "types";

const selectImageEntities = ({ data }: { data: DataStoreSlice }) => {
  return data.images.entities;
};

export const selectActiveImageName = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    return imageEntities[activeImageId!].name;
  }
);
