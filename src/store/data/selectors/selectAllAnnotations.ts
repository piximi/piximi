import { createSelector } from "@reduxjs/toolkit";
import { DataStoreSlice } from "types";

export const selectAllAnnotations = createSelector(
  [
    ({ data }: { data: DataStoreSlice }) => {
      return data.annotations.entities;
    },
  ],
  (annotationEntities) => {
    return Object.values(annotationEntities);
  }
);
