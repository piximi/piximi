import { WritableDraft } from "immer";
import { ImageData } from "../types";
import {
  deleteImageCascade,
  updateImageCascade,
} from "../cascade-operations/imageCascades";
import { DataState } from "store/types";

export const deleteImageDataBatch = (
  state: WritableDraft<DataState>,
  imageIds: string[],
) => {
  imageIds.forEach((imageId) => deleteImageCascade(state, imageId));
};

export const updateImageDataBatch = (
  state: WritableDraft<DataState>,
  batchChanges: {
    id: string;
    changes: Partial<Pick<ImageData, "partition" | "categoryId" | "colors">>;
  }[],
) => {
  batchChanges.forEach(({ id, changes }) => {
    updateImageCascade(state, id, changes);
  });
};
