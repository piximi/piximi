import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/annotator";
import { DataStoreSlice } from "types";

const selectImageEntities = ({ data }: { data: DataStoreSlice }) => {
  return data.images.entities;
};

export const selectActiveImageData = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId!].data;
  }
);
