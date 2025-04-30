import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import { dataSlice } from "store/data";
import { isUnknownCategory } from "store/data/helpers";
import {
  selectActiveLabeledThings,
  selectActiveLabeledThingsCount,
  selectActiveThingsByPartition,
  selectActiveUnknownCategoryId,
} from "store/project/reselectors";
import { ModelStatus, Partition } from "utils/models/enums";

enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
}

type ErrorContext = { reason: ErrorReason; message: string };

const ClassifierStatusContext = createContext<{
  isReady: boolean;
  trainable: boolean;
  modelStatus: ModelStatus;
  setModelStatus: React.Dispatch<React.SetStateAction<ModelStatus>>;
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
  setModelStatus: (_value: React.SetStateAction<ModelStatus>) => {},
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
  const [isReady, setIsReady] = useState(true);
  const [error, setError] = useState<ErrorContext>();
  const selectedModel = useSelector(selectClassifierModel);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const thingsByPartition = useSelector(selectActiveThingsByPartition);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const unknowCatId = useSelector(selectActiveUnknownCategoryId);
  const activeLabeledThings = useSelector(selectActiveLabeledThings);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(ModelStatus.Idle);

  const [newModelName, setNewModelName] = useState("");

  const hasLabeledInference = useMemo(() => {
    return activeLabeledThings.some(
      (thing) =>
        !isUnknownCategory(thing.categoryId) &&
        thing.partition === Partition.Inference,
    );
  }, [activeLabeledThings]);

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(
    () => !selectedModel || selectedModel.trainable,
    [selectedModel],
  );
  const noLabeledThings = useMemo(
    () => labeledThingsCount === 0,
    [labeledThingsCount],
  );

  const clearPredictions = () => {
    if (!unknowCatId)
      throw new Error(`Invalid Unknown Category Id: ${unknowCatId}.`);
    const inferenceThings = thingsByPartition[Partition.Inference];
    const updates = inferenceThings.reduce(
      (updates, thing) => {
        updates.push({
          id: thing.id,
          categoryId: unknowCatId,
        });
        return updates;
      },
      [] as { id: string; categoryId: string }[],
    );
    dispatch(dataSlice.actions.updateThings({ updates }));
  };

  const acceptPredictions = () => {
    const inferenceThings = thingsByPartition[Partition.Inference];
    const updates = inferenceThings.reduce(
      (updates, thing) => {
        if (isUnknownCategory(thing.categoryId)) return updates;
        updates.push({
          id: thing.id,
          partition: Partition.Unassigned,
        });
        return updates;
      },
      [] as { id: string; partition: Partition }[],
    );
    dispatch(dataSlice.actions.updateThings({ updates }));
  };

  useEffect(() => {
    if (!trainable) {
      setIsReady(false);
      setError({
        reason: ErrorReason.NotTrainable,
        message: "Selected model is not trainable.",
      });
    } else if (noLabeledThings) {
      setIsReady(false);
      setError({
        reason: ErrorReason.NoLabeledImages,
        message: "Please label images to train a model.",
      });
    } else {
      setIsReady(true);
      setError(undefined);
    }
  }, [selectedModel, trainable, noLabeledThings]);

  return (
    <ClassifierStatusContext.Provider
      value={{
        isReady,
        trainable,
        modelStatus,
        setModelStatus,
        shouldWarnClearPredictions: shouldWarnClearPredictions,
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
