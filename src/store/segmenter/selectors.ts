import { createSelector } from "@reduxjs/toolkit";
import { Shape } from "store/data/types";
import { SegmenterState } from "store/types";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { ModelStatus } from "utils/models/enums";
import {
  CompileOptions,
  FitOptions,
  PreprocessOptions,
} from "utils/models/types";

export const selectSegmenter = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): SegmenterState => {
  return segmenter;
};

export const selectSegmenterCompileOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): CompileOptions => {
  return segmenter.compileOptions;
};

export const selectSegmenterFitOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): FitOptions => {
  return segmenter.fitOptions;
};

export const selectSegmenterInputShape = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): Shape => {
  return segmenter.inputShape;
};

export const selectSegmenterModel = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}) => {
  return availableSegmenterModels[segmenter.selectedModelIdx];
};

export const selectSegmenterHistory = createSelector(
  [selectSegmenterModel, (state, items: string[]) => items],
  (model, items) => {
    const fullHistory = model.history.history;
    const selectedHistory: { [key: string]: number[] } = {};

    for (const k of items) {
      if (k === "epochs") {
        selectedHistory[k] = model.history.epochs;
      } else {
        selectedHistory[k] = fullHistory.flatMap(
          (cycleHistory) => cycleHistory[k]
        );
      }
    }

    return selectedHistory;
  }
);

const selectedIdxSelector = ({ segmenter }: { segmenter: SegmenterState }) =>
  segmenter.selectedModelIdx;

export const selectSegmenterModelIdx = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableSegmenterModels[idx],
  })
);

export const selectSegmenterModelStatus = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): ModelStatus => {
  return segmenter.modelStatus;
};

export const selectSegmenterPreprocessOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): PreprocessOptions => {
  return segmenter.preprocessOptions;
};

export const selectSegmenterShuffleOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): boolean => {
  return segmenter.preprocessOptions.shuffle;
};

export const selectSegmenterTrainingPercentage = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): number => {
  return segmenter.trainingPercentage;
};
