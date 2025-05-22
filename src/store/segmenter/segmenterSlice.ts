import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { availableSegmenterModels } from "utils/models/availableSegmentationModels";

import { SegmenterState } from "store/types";
import { Shape } from "store/data/types";

export const initialState: SegmenterState = {
  selectedModelIdx: undefined,

  inferenceOptions: {
    epochs: 10,
    batchSize: 32,
  },
};

export const segmenterSlice = createSlice({
  name: "segmenter",
  initialState: initialState,
  reducers: {
    resetSegmenter: () => initialState,
    setSegmenter(
      state,
      action: PayloadAction<{
        segmenter: SegmenterState;
      }>,
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.segmenter;
      return action.payload.segmenter;
    },
    loadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        model: (typeof availableSegmenterModels)[number];
      }>,
    ) {
      const { model } = action.payload;

      if (model.pretrained) {
        const selectedModelIdx = availableSegmenterModels.findIndex(
          (m) => m.name === model.name,
        );
        state.selectedModelIdx = selectedModelIdx
          ? selectedModelIdx
          : undefined;
      } else {
        availableSegmenterModels.push(model);
        state.selectedModelIdx = availableSegmenterModels.length - 1;
      }
    },
  },
});
