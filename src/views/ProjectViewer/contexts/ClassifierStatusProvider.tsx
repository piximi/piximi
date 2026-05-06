import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  selectAllCreatedModelNames,
  selectKindClassifier,
  selectModelLifecycleStatus,
  selectShowClearPredictionsWarning,
} from "store/classifier/selectors";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import {
  selectActiveLabeledItems,
  selectActiveItemsByPartition,
  selectActiveUnknownCategory,
} from "@ProjectViewer/state/reselectors";
import {
  selectProjectImageChannels,
  selectActiveClassifierModelTarget,
} from "@ProjectViewer/state/selectors";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { useParameterizedSelector } from "store/hooks";

import { Partition } from "utils/dl/enums";
import { findReplicateName, representsUnknown } from "utils/stringUtils";
import classifierHandler from "utils/dl/classification/classifierHandler";

export enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
  ChannelMismatch,
  DuplicateModelName,
  Invalid,
}

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

const ClassifierStatusContext = createContext<{
  isReady: boolean;
  trainable: boolean;
  shouldWarnClearPredictions: boolean;
  error?: ErrorContext;
  activeErrors: ErrorContext[];
  newModelName: string;
  setNewModelName: React.Dispatch<React.SetStateAction<string>>;
  clearPredictions: () => void;
  acceptPredictions: () => void;
}>({
  isReady: true,
  trainable: true,
  shouldWarnClearPredictions: false,
  newModelName: "",
  setNewModelName: (_value: React.SetStateAction<string>) => {},
  clearPredictions: () => {},
  acceptPredictions: () => {},
  activeErrors: [],
});

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );
  const inferenceItems = useParameterizedSelector(
    selectActiveItemsByPartition,
    Partition.Inference,
  );
  const unknowCategory = useSelector(selectActiveUnknownCategory);
  const activeLabeledItems = useSelector(selectActiveLabeledItems);
  const projectChannels = useSelector(selectProjectImageChannels);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget.id,
  );

  const [isReady, setIsReady] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const restrictedClassifierNames = useSelector(selectAllCreatedModelNames);
  const [error, setError] = useState<ErrorContext>();
  const [activeErrors, setActiveErrors] = useState<ErrorContext[]>([]);

  const model = useMemo(() => {
    if (!kindClassifier || !kindClassifier.activeModel) return;
    return classifierHandler.getModel(kindClassifier.activeModel);
  }, [kindClassifier?.activeModel]);

  const targetItemType = useMemo(
    () => (modelTarget.id === IMAGE_CLASSIFIER_ID ? "images" : "annotations"),
    [modelTarget.id],
  );

  const hasLabeledInference = useMemo(() => {
    return inferenceItems.some((item) => !representsUnknown(item.categoryId));
  }, [inferenceItems]);

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(() => !model || model.trainable, [model]);
  const noLabeledThings = useMemo(
    () => activeLabeledItems.length === 0,
    [activeLabeledItems],
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
    if (targetItemType === "images") {
      dispatch(dataSliceV2.actions.batchUpdateImageCategory(updates));
    } else {
      dispatch(
        dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(updates),
      );
    }
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
    if (targetItemType === "images") {
      dispatch(dataSliceV2.actions.batchUpdateImagePartition(updates));
    } else {
      dispatch(dataSliceV2.actions.batchUpdateAnnotationPartition(updates));
    }
  };

  useEffect(() => {
    const newErrors: ErrorContext[] = [];
    let newIsReady = true;

    if (!trainable) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.NotTrainable,
        message: "Selected model is not trainable.",
        severity: 1,
      });
    }
    if (noLabeledThings) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.NoLabeledImages,
        message: "Please label images to train a model.",
        severity: 3,
      });
    }
    if (
      model?.preprocessingOptions &&
      projectChannels &&
      projectChannels !== model.preprocessingOptions.inputShape.channels
    ) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: `The model requires ${model?.preprocessingOptions.inputShape.channels}-channel images, but the project images have ${projectChannels}`,
        severity: 2,
      });
    }
    if (findReplicateName(newModelName, restrictedClassifierNames)) {
      newIsReady = false;
      newErrors.push({
        reason: ErrorReason.DuplicateModelName,
        message: `A model with the name ${newModelName} already exists`,
        severity: 1,
      });
    }

    if (modelStatus === "invalid") {
      newIsReady = false;
      newErrors.push({
        reason: ErrorReason.Invalid,
        message: `Categories have changed since last training run`,
        severity: 3,
      });
    }

    const mostSevere: undefined | ErrorContext =
      newErrors.length === 0
        ? undefined
        : newErrors.reduce((prev, curr) =>
            curr.severity < prev.severity ? curr : prev,
          );
    setIsReady(newIsReady);
    setError(mostSevere);
    setActiveErrors(newErrors);
  }, [
    model,
    trainable,
    noLabeledThings,
    projectChannels,
    modelTarget,
    newModelName,
    restrictedClassifierNames,
  ]);

  return (
    <ClassifierStatusContext.Provider
      value={{
        isReady,
        trainable,
        shouldWarnClearPredictions,
        error,
        newModelName,
        setNewModelName,
        clearPredictions,
        acceptPredictions,
        activeErrors,
      }}
    >
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
