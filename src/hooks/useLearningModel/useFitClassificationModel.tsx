import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectAlertState } from "store/applicationSettings/selectors";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierFitOptions,
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
  selectClassifierTrainingPercentage,
} from "store/classifier/selectors";
import {
  selectActiveLabeledThings,
  selectActiveLabeledThingsCount,
} from "store/project/reselectors";

import { isUnknownCategory, logger } from "utils/common/helpers";

import { ModelStatus, Partition } from "utils/models/enums";
import { AlertType } from "utils/common/enums";

import { AlertState } from "utils/common/types";
import { TrainingCallbacks } from "utils/models/types";

type PlotData = { x: number; y: number }[];
const historyItems = [
  "loss",
  "val_loss",
  "categoricalAccuracy",
  "val_categoricalAccuracy",
  "epochs",
];

const noLabeledThingsAlert: AlertState = {
  alertType: AlertType.Info,
  name: "No labeled images",
  description: "Please label images to train a model.",
};
export const useFitClassificationModel = () => {
  const dispatch = useDispatch();

  // ComponentState
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showPlots, setShowPlots] = useState<boolean>(false);
  const [trainingAccuracy, setTrainingAccuracy] = useState<PlotData>([]);
  const [validationAccuracy, setValidationAccuracy] = useState<PlotData>([]);
  const [trainingLoss, setTrainingLoss] = useState<PlotData>([]);
  const [validationLoss, setValidationLoss] = useState<PlotData>([]);

  // StoreState
  const activeLabeledThings = useSelector(selectActiveLabeledThings);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const modelStatus = useSelector(selectClassifierModelStatus);
  const alertState = useSelector(selectAlertState);
  const fitOptions = useSelector(selectClassifierFitOptions);
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);

  const hasLabeledInference = useMemo(() => {
    return activeLabeledThings.some(
      (thing) =>
        !isUnknownCategory(thing.categoryId) &&
        thing.partition === Partition.Inference,
    );
  }, [activeLabeledThings]);

  const noLabeledThings = useMemo(
    () => labeledThingsCount === 0,
    [labeledThingsCount],
  );

  const modelHistory = useMemo(() => {
    const fullHistory = selectedModel.history.history;
    const selectedHistory: { [key: string]: number[] } = {};
    for (const k of historyItems) {
      if (k === "epochs") {
        selectedHistory[k] = selectedModel.history.epochs;
      } else {
        selectedHistory[k] = fullHistory.flatMap(
          (cycleHistory) => cycleHistory[k],
        );
      }
    }

    return selectedHistory;
  }, [selectedModel]);

  const trainingHistoryCallback: TrainingCallbacks["onEpochEnd"] = async (
    epoch,
    logs,
  ) => {
    const nextEpoch = selectedModel.numEpochs + epoch + 1;
    const trainingEpochIndicator = nextEpoch - 0.5;

    setCurrentEpoch((currentEpoch) => currentEpoch + 1);

    if (!logs) return;

    if (logs.categoricalAccuracy) {
      setTrainingAccuracy((prevState) =>
        prevState.concat({
          x: trainingEpochIndicator,
          y: logs.categoricalAccuracy as number,
        }),
      );
    }
    if (logs.val_categoricalAccuracy) {
      setValidationAccuracy((prevState) =>
        prevState.concat({
          x: nextEpoch,
          y: logs.val_categoricalAccuracy as number,
        }),
      );
    }
    if (logs.loss) {
      setTrainingLoss((prevState) =>
        prevState.concat({ x: trainingEpochIndicator, y: logs.loss as number }),
      );
    }
    if (logs.val_loss) {
      setValidationLoss((prevState) =>
        prevState.concat({ x: nextEpoch, y: logs.val_loss as number }),
      );
    }

    setShowPlots(true);
  };

  const handleFit = async () => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
        }),
      );
    } else {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
        }),
      );
    }
  };

  useEffect(() => {
    if (!noLabeledThings && selectedModel.trainable) {
      setShowWarning(true);
    }
  }, [noLabeledThings, selectedModel.trainable]);

  useEffect(() => {
    setTrainingAccuracy(
      modelHistory.categoricalAccuracy.map((y, i) => ({ x: i + 0.5, y })),
    );
    setValidationAccuracy(
      modelHistory.val_categoricalAccuracy.map((y, i) => ({ x: i + 1, y })),
    );
    setTrainingLoss(modelHistory.loss.map((y, i) => ({ x: i + 0.5, y })));
    setValidationLoss(modelHistory.val_loss.map((y, i) => ({ x: i + 1, y })));

    // modelHistory.epochs.length same as numEpochs
    // the rest should be same length as well
    // don't use modelHistory.numEpochs because then it will need to be
    // a useEffect dependency, and we don't want to react to model object
    // state changes directly, only through useSelector returned values
    setShowPlots(modelHistory.epochs.length > 0);

    setCurrentEpoch(0);
  }, [modelHistory]);

  useEffect(() => {
    if (
      import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      labeledThingsCount > 0
    ) {
      const trainingSize = Math.round(labeledThingsCount * trainingPercentage);
      const validationSize = labeledThingsCount - trainingSize;

      logger(
        `Set training size to Round[${labeledThingsCount} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${labeledThingsCount} - ${trainingSize} = ${validationSize}`,
      );

      logger(
        `Set training batches per epoch to RoundUp[${trainingSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(trainingSize / fitOptions.batchSize)}`,
      );

      logger(
        `Set validation batches per epoch to RoundUp[${validationSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(validationSize / fitOptions.batchSize)}`,
      );

      logger(
        `Training last batch size is ${trainingSize % fitOptions.batchSize}
        ; validation is ${validationSize % fitOptions.batchSize}`,
      );
    }
  }, [fitOptions.batchSize, trainingPercentage, labeledThingsCount]);

  useEffect(() => {
    if (modelStatus === ModelStatus.Uninitialized) {
      setTrainingAccuracy([]);
      setValidationAccuracy([]);
      setTrainingLoss([]);
      setValidationLoss([]);
      setShowPlots(false);
    }
  }, [modelStatus]);
  return {
    showWarning,
    setShowWarning,
    currentEpoch,
    showPlots,
    trainingAccuracy,
    validationAccuracy,
    trainingLoss,
    validationLoss,
    noLabeledThings,
    selectedModel,
    modelStatus,
    alertState,
    fitOptions,
    trainingPercentage,
    noLabeledThingsAlert,
    handleFit,
    hasLabeledInference,
  };
};
