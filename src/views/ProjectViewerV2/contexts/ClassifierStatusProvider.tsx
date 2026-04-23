import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import { selectShowClearPredictionsWarning } from "store/classifierV2/selectors";
import { selectKindIds } from "store/dataV2/selectors";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import {
  selectActiveClassifierModel,
  selectActiveLabeledItems,
  selectActiveItemsByPartition,
  selectActiveUnknownCategory,
} from "@ProjectViewer/state/reselectors";
import {
  selectProjectImageChannels,
  selectActiveClassifierModelTarget,
} from "@ProjectViewer/state/selectors";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";
import { useParameterizedSelector } from "store/hooks";

import { getDifferences } from "utils/arrayUtils";
import { ModelStatus, Partition } from "utils/models/enums";
import { representsUnknown } from "utils/stringUtils";

export enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
  ChannelMismatch,
}

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

const ClassifierStatusContext = createContext<{
  isReady: boolean;
  trainable: boolean;
  modelStatus: ModelStatus;
  setModelStatus: (status: ModelStatus) => void;
  shouldWarnClearPredictions: boolean;
  error?: ErrorContext;
  newModelName: string;
  setNewModelName: React.Dispatch<React.SetStateAction<string>>;
  clearPredictions: () => void;
  acceptPredictions: () => void;
}>({
  isReady: true,
  trainable: true,
  modelStatus: ModelStatus.Idle,
  setModelStatus: (_status) => {},
  shouldWarnClearPredictions: false,
  newModelName: "",
  setNewModelName: (_value: React.SetStateAction<string>) => {},
  clearPredictions: () => {},
  acceptPredictions: () => {},
});

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectActiveClassifierModel);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const projectKinds = useSelector(selectKindIds);
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

  const [isReady, setIsReady] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const [error, setError] = useState<ErrorContext>();
  const [modelStatusDict, setModelStatusDict] = useState<
    Record<string, ModelStatus>
  >({ [IMAGE_CLASSIFIER_ID]: ModelStatus.Idle });

  const targetItemType = useMemo(
    () => (modelTarget.id === IMAGE_CLASSIFIER_ID ? "images" : "annotations"),
    [modelTarget.id],
  );

  useEffect(() => {
    const classifierKinds = Object.keys(modelStatusDict);

    const kindChanges = getDifferences(classifierKinds, projectKinds);

    const nextStatusDict = { ...modelStatusDict };

    kindChanges.added.forEach(
      (newKind) => (nextStatusDict[newKind] = ModelStatus.Idle),
    );
    kindChanges.removed.forEach(
      (removedKind) => delete nextStatusDict[removedKind],
    );
    setModelStatusDict(nextStatusDict);
  }, [projectKinds]);

  const modelStatus = useMemo(() => {
    return modelStatusDict?.[modelTarget.id] ?? ModelStatus.Idle;
  }, [modelTarget, modelStatusDict]);

  const setModelStatus = useCallback(
    (status: ModelStatus) => {
      setModelStatusDict((dict) => ({ ...dict, [modelTarget.id]: status }));
    },
    [modelTarget],
  );

  const hasLabeledInference = useMemo(() => {
    return inferenceItems.some((item) => !representsUnknown(item.categoryId));
  }, [inferenceItems]);

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(
    () => !selectedModel || selectedModel.trainable,
    [selectedModel],
  );
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
      selectedModel?.preprocessingOptions &&
      projectChannels &&
      projectChannels !== selectedModel.preprocessingOptions.inputShape.channels
    ) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: `The model requires ${selectedModel?.preprocessingOptions.inputShape.channels}-channel images, but the project images have ${projectChannels}`,
        severity: 2,
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
  }, [selectedModel, trainable, noLabeledThings, projectChannels, modelTarget]);

  return (
    <ClassifierStatusContext.Provider
      value={{
        isReady,
        trainable,
        modelStatus,
        setModelStatus,
        shouldWarnClearPredictions,
        error,
        newModelName,
        setNewModelName,
        clearPredictions,
        acceptPredictions,
      }}
    >
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
