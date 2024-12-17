import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectAlertState } from "store/applicationSettings/selectors";
import { selectAnnotatedImages } from "store/data/selectors";
import { segmenterSlice } from "store/segmenter";
import {
  selectSegmenterFitOptions,
  selectSegmenterHistory,
  selectSegmenterModel,
  selectSegmenterModelStatus,
  selectSegmenterTrainingPercentage,
} from "store/segmenter/selectors";

import { logger } from "utils/common/helpers";

import { AlertType } from "utils/common/enums";
import { ModelStatus } from "utils/models/enums";

import { AlertState } from "utils/common/types";
import { TrainingCallbacks } from "utils/models/types";

const items = [
  "loss",
  "val_loss",
  "categoricalAccuracy",
  "val_categoricalAccuracy",
  "epochs",
];

const noLabeledImageAlert: AlertState = {
  alertType: AlertType.Info,
  name: "No annotated images",
  description: "Please annotate images to train a model.",
};

export const useSegmentationModelAgain = () => {
  const dispatch = useDispatch();

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);

  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [hasLabeledImages, setHasLabeledImages] = useState<boolean>(false);
  const [showPlots, setShowPlots] = useState<boolean>(false);

  const [trainingAccuracy, setTrainingAccuracy] = useState<
    { x: number; y: number }[]
  >([]);

  const [validationAccuracy, setValidationAccuracy] = useState<
    { x: number; y: number }[]
  >([]);

  const [trainingLoss, setTrainingLoss] = useState<{ x: number; y: number }[]>(
    [],
  );

  const [validationLoss, setValidationLoss] = useState<
    { x: number; y: number }[]
  >([]);

  /* APPLICATION */
  const alertState = useSelector(selectAlertState);

  /* SEGMENTER */
  const selectedModel = useSelector(selectSegmenterModel);
  const modelStatus = useSelector(selectSegmenterModelStatus);
  const fitOptions = useSelector(selectSegmenterFitOptions);
  const trainingPercentage = useSelector(selectSegmenterTrainingPercentage);
  const modelHistory = useSelector((state) =>
    selectSegmenterHistory(state, items),
  );

  /* DATA */
  const annotatedImages = useSelector(selectAnnotatedImages);

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
        segmenterSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
        }),
      );
    } else {
      dispatch(
        segmenterSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
        }),
      );
    }
  };
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
    if (annotatedImages.length === 0) {
      setHasLabeledImages(false);
      if (hasLabeledImages && selectedModel.trainable) {
        setShowWarning(true);
      }
    } else {
      setHasLabeledImages(true);
    }
  }, [annotatedImages, hasLabeledImages, selectedModel]);

  useEffect(() => {
    if (
      import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      annotatedImages.length > 0
    ) {
      const trainingSize = Math.round(
        annotatedImages.length * trainingPercentage,
      );
      const validationSize = annotatedImages.length - trainingSize;

      logger(
        `Set training size to Round[${annotatedImages.length} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${annotatedImages.length} - ${trainingSize} = ${validationSize}`,
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
  }, [fitOptions.batchSize, trainingPercentage, annotatedImages.length]);

  return {
    modelStatus,
    selectedModel,
    fitOptions,
    hasLabeledImages,
    handleFit,
    currentEpoch,
    trainingPercentage,
    trainingAccuracy,
    trainingLoss,
    validationAccuracy,
    validationLoss,
    showPlots,
    showWarning,
    setShowWarning,
    noLabeledImageAlert,
    alertState,
  };
};
