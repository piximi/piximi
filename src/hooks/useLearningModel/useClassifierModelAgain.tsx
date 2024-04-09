import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAlertState } from "store/applicationSettings";
import {
  classifierSlice,
  selectClassifierFitOptions,
  selectClassifierHistory,
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
  selectClassifierTrainingPercentage,
} from "store/classifier";
import { selectActiveLabeledThingsCount } from "store/data/selectors/reselectors";
import { AlertType } from "utils/common/enums";
import { logger } from "utils/common/helpers";
import { AlertState } from "utils/common/types";
import { ModelStatus } from "utils/models/enums";
import { TrainingCallbacks } from "utils/models/types";

const historyItems = [
  "loss",
  "val_loss",
  "categoricalAccuracy",
  "val_categoricalAccuracy",
  "epochs",
];

export const useClassificationModelAgain = () => {
  const dispatch = useDispatch();

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showPlots, setShowPlots] = useState<boolean>(false);
  const [trainingAccuracy, setTrainingAccuracy] = useState<
    { x: number; y: number }[]
  >([]);
  const [validationAccuracy, setValidationAccuracy] = useState<
    { x: number; y: number }[]
  >([]);
  const [trainingLoss, setTrainingLoss] = useState<{ x: number; y: number }[]>(
    []
  );
  const [validationLoss, setValidationLoss] = useState<
    { x: number; y: number }[]
  >([]);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const modelStatus = useSelector(selectClassifierModelStatus);
  const alertState = useSelector(selectAlertState);
  const fitOptions = useSelector(selectClassifierFitOptions);
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);
  const modelHistory = useSelector((state) => {
    return selectClassifierHistory(state, historyItems);
  });
  const noLabeledThingsAlert: AlertState = {
    alertType: AlertType.Info,
    name: "No labeled images",
    description: "Please label images to train a model.",
  };

  const trainingHistoryCallback: TrainingCallbacks["onEpochEnd"] = async (
    epoch,
    logs
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
        })
      );
    }
    if (logs.val_categoricalAccuracy) {
      setValidationAccuracy((prevState) =>
        prevState.concat({
          x: nextEpoch,
          y: logs.val_categoricalAccuracy as number,
        })
      );
    }
    if (logs.loss) {
      setTrainingLoss((prevState) =>
        prevState.concat({ x: trainingEpochIndicator, y: logs.loss as number })
      );
    }
    if (logs.val_loss) {
      setValidationLoss((prevState) =>
        prevState.concat({ x: nextEpoch, y: logs.val_loss as number })
      );
    }

    setShowPlots(true);
  };

  const handleFit = async () => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      dispatch(
        classifierSlice.actions.updateModelStatusNew({
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
        })
      );
    } else {
      dispatch(
        classifierSlice.actions.updateModelStatusNew({
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
        })
      );
    }
  };

  useEffect(() => {
    if (labeledThingsCount > 0 && selectedModel.trainable) {
      setShowWarning(true);
    }
  }, [labeledThingsCount, selectedModel]);
  useEffect(() => {
    setTrainingAccuracy(
      modelHistory.categoricalAccuracy.map((y, i) => ({ x: i + 0.5, y }))
    );
    setValidationAccuracy(
      modelHistory.val_categoricalAccuracy.map((y, i) => ({ x: i + 1, y }))
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
      process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      labeledThingsCount > 0
    ) {
      const trainingSize = Math.round(labeledThingsCount * trainingPercentage);
      const validationSize = labeledThingsCount - trainingSize;

      logger(
        `Set training size to Round[${labeledThingsCount} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${labeledThingsCount} - ${trainingSize} = ${validationSize}`
      );

      logger(
        `Set training batches per epoch to RoundUp[${trainingSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(trainingSize / fitOptions.batchSize)}`
      );

      logger(
        `Set validation batches per epoch to RoundUp[${validationSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(validationSize / fitOptions.batchSize)}`
      );

      logger(
        `Training last batch size is ${trainingSize % fitOptions.batchSize}
        ; validation is ${validationSize % fitOptions.batchSize}`
      );
    }
  }, [fitOptions.batchSize, trainingPercentage, labeledThingsCount]);

  return {
    showWarning,
    setShowWarning,
    currentEpoch,
    showPlots,
    trainingAccuracy,
    validationAccuracy,
    trainingLoss,
    validationLoss,
    labeledThingsCount,
    selectedModel,
    modelStatus,
    alertState,
    fitOptions,
    trainingPercentage,
    noLabeledThingsAlert,
    handleFit,
  };
};
