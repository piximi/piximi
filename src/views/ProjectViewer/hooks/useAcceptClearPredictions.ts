import React from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import {
  selectActiveItemsByPartition,
  selectActiveUnknownCategory,
} from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { classifierSlice } from "store/classifier";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { dataSliceV2 } from "store/dataV2";
import { useParameterizedSelector } from "store/hooks";

import { Partition } from "utils/dl/enums";
import { representsUnknown } from "utils/stringUtils";

export const useAcceptClearPredictions = () => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const unknowCategory = useSelector(selectActiveUnknownCategory);
  const inferenceItems = useParameterizedSelector(
    selectActiveItemsByPartition,
    Partition.Inference,
  );
  const clearPredictions = () => {
    if (!unknowCategory) throw new Error(`Invalid Unknown Category.`);
    const updates = inferenceItems.reduce(
      (updates: { id: string; categoryId: string }[], items) => {
        updates.push({
          id: items.id,
          categoryId: unknowCategory.id,
        });
        return updates;
      },
      [],
    );
    batch(() => {
      if (modelTarget === IMAGE_CLASSIFIER_ID)
        dispatch(dataSliceV2.actions.batchUpdateImageCategory(updates));
      else
        dispatch(
          dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(updates),
        );
      dispatch(
        classifierSlice.actions.setModelStatus({
          targetId: modelTarget,
          status: "idle",
        }),
      );
    });
  };

  const acceptPredictions = () => {
    const updates = inferenceItems.reduce(
      (updates: { id: string; partition: Partition }[], item) => {
        if (representsUnknown(item.categoryId)) return updates;
        updates.push({
          id: item.id,
          partition: Partition.Unassigned,
        });
        return updates;
      },
      [],
    );
    batch(() => {
      if (modelTarget === IMAGE_CLASSIFIER_ID)
        dispatch(dataSliceV2.actions.batchUpdateImagePartition(updates));
      else
        dispatch(dataSliceV2.actions.batchUpdateAnnotationPartition(updates));
      dispatch(
        classifierSlice.actions.setModelStatus({
          targetId: modelTarget,
          status: "idle",
        }),
      );
    });
  };
  return { acceptPredictions, clearPredictions };
};
