import { WritableDraft } from "immer";
import { ImageObject } from "../types";
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
    changes: Partial<Pick<ImageObject, "partition" | "categoryId" | "colors">>;
  }[],
) => {
  batchChanges.forEach(({ id, changes }) => {
    updateImageCascade(state, id, changes);
  });
};
