import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {
  selectClassifierModel,
  selectClassifierStatus,
} from "store/classifier/reselectors";
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import { isUnknownCategory } from "store/data/helpers";
import {
  selectActiveLabeledThings,
  selectActiveLabeledThingsCount,
} from "store/project/reselectors";
import { AlertType } from "utils/common/enums";
import { AlertState } from "utils/common/types";
import { ModelStatus, Partition } from "utils/models/enums";

enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
}

type ErrorContext = { reason: ErrorReason; message: string };

const noLabeledThingsAlert: AlertState = {
  alertType: AlertType.Info,
  name: "No labeled images",
  description: "Please label images to train a model.",
};

const ClassifierStatusContext = createContext<{
  isReady: boolean;
  trainable: boolean;
  isTraining: boolean;
  shouldClearPredictions: boolean;
  error?: ErrorContext;
  newModelName: string;
  setNewModelName: React.Dispatch<React.SetStateAction<string>>;
}>({
  isReady: true,
  trainable: true,
  isTraining: false,
  shouldClearPredictions: false,
  newModelName: "",
  setNewModelName: (_value: React.SetStateAction<string>) => {},
});

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isReady, setIsReady] = useState(true);
  const [error, setError] = useState<ErrorContext>();
  const selectedModel = useSelector(selectClassifierModel);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning
  );
  const activeLabeledThings = useSelector(selectActiveLabeledThings);
  const modelStatus = useSelector(selectClassifierStatus);

  const [newModelName, setNewModelName] = useState("");

  const isTraining = useMemo(
    () =>
      modelStatus === ModelStatus.InitFit ||
      modelStatus === ModelStatus.Loading ||
      modelStatus === ModelStatus.Training,
    [modelStatus]
  );

  const hasLabeledInference = useMemo(() => {
    return activeLabeledThings.some(
      (thing) =>
        !isUnknownCategory(thing.categoryId) &&
        thing.partition === Partition.Inference
    );
  }, [activeLabeledThings]);

  const shouldClearPredictions = useMemo(() => {
    return !showClearPredictionsWarning || !hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(
    () => !selectedModel || selectedModel.trainable,
    [selectedModel]
  );
  const noLabeledThings = useMemo(
    () => labeledThingsCount === 0,
    [labeledThingsCount]
  );

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
        isTraining,
        shouldClearPredictions,
        error,
        newModelName,
        setNewModelName,
      }}
    >
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
