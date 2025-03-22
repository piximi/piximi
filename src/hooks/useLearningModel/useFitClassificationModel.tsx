import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { classifierSlice } from "store/classifier";
import { selectAlertState } from "store/applicationSettings/selectors";
import { selectActiveKindId } from "store/project/selectors";
import {
  selectActiveClassifierModel,
  selectActiveClassifierModelStatus,
} from "store/classifier/reselectors";
import {
  selectActiveLabeledThings,
  selectActiveLabeledThingsCount,
} from "store/project/reselectors";

import { isUnknownCategory } from "store/data/helpers";

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
  const activeKindId = useSelector(selectActiveKindId);
  const activeLabeledThings = useSelector(selectActiveLabeledThings);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const modelStatus = useSelector(selectActiveClassifierModelStatus);
  const alertState = useSelector(selectAlertState);

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
    if (!selectedModel) return {};
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
    let nextEpoch: number;
    if (!selectedModel) {
      nextEpoch = epoch + 1;
    } else {
      nextEpoch = selectedModel.numEpochs + epoch + 1;
    }
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

  const handleFit = async (nameOrArch: string | number) => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          kindId: activeKindId,
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
          nameOrArch,
        }),
      );
    } else {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          kindId: activeKindId,
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
          nameOrArch,
        }),
      );
    }
  };

  useEffect(() => {
    if (!noLabeledThings && selectedModel && selectedModel.trainable) {
      setShowWarning(true);
    }
  }, [noLabeledThings, selectedModel, selectedModel?.trainable]);

  useEffect(() => {
    if (!modelHistory.categoricalAccuracy) return;
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
    noLabeledThingsAlert,
    handleFit,
    hasLabeledInference,
  };
};
