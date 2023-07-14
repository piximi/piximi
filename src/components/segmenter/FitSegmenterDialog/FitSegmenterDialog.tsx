import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import { OptimizerSettingsListItem } from "components/common/list-items/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "components/common/list-items/DatasetSettingsListItem/DatasetSettingsListItem";
import { TrainingHistoryPlot } from "components/common/styled-components/TrainingHistoryPlot";
import { DialogTransitionSlide, AlertDialog } from "components/common/dialogs";
import { FitSegmenterDialogAppBar } from "../FitSegmenterDialogAppBar";
import { SegmenterArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { ModelSummaryTable } from "components/common/styled-components";

import { alertStateSelector } from "store/application";
import { selectAnnotatedImages } from "store/data";
import {
  segmenterFitOptionsSelector,
  segmenterCompileOptionsSelector,
  segmenterTrainingPercentageSelector,
  segmenterSlice,
  segmenterModelSelector,
  segmenterModelStatusSelector,
} from "store/segmenter";

import {
  AlertStateType,
  AlertType,
  LossFunction,
  OptimizationAlgorithm,
} from "types";
import { TrainingCallbacks } from "utils/common/models/Model";
import { ModelStatus } from "types/ModelType";

type FitSegmenterDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitSegmenterDialog = (props: FitSegmenterDialogProps) => {
  const dispatch = useDispatch();

  const { closeDialog, openedDialog } = props;

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [totalEpochs, setTotalEpochs] = useState<number>(0);

  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [noLabeledImages, setNoLabeledImages] = useState<boolean>(false);
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

  const annotatedImages = useSelector(selectAnnotatedImages);
  const selectedModel = useSelector(segmenterModelSelector);
  const modelStatus = useSelector(segmenterModelStatusSelector);

  const alertState = useSelector(alertStateSelector);

  const fitOptions = useSelector(segmenterFitOptionsSelector);
  const compileOptions = useSelector(segmenterCompileOptionsSelector);
  const trainingPercentage = useSelector(segmenterTrainingPercentageSelector);

  const dispatchBatchSizeCallback = (batchSize: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationBatchSize({
        batchSize: batchSize,
      })
    );
  };

  const dispatchLearningRateCallback = (learningRate: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationLearningRate({
        learningRate: learningRate,
      })
    );
  };

  const dispatchEpochsCallback = (epochs: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationEpochs({ epochs: epochs })
    );
  };

  const dispatchOptimizationAlgorithmCallback = (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  const dispatchLossFunctionCallback = (lossFunction: LossFunction) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationLossFunction({
        lossFunction: lossFunction,
      })
    );
  };

  const dispatchTrainingPercentageCallback = (trainPercentage: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationTrainingPercentage({
        trainingPercentage: trainPercentage,
      })
    );
  };

  const noLabeledImageAlert: AlertStateType = {
    alertType: AlertType.Info,
    name: "No labeled images",
    description: "Please label images to train a model.",
  };

  useEffect(() => {
    if (annotatedImages.length === 0) {
      setNoLabeledImages(true);
      if (!noLabeledImages && selectedModel.trainable) {
        setShowWarning(true);
      }
    } else {
      setNoLabeledImages(false);
    }
  }, [annotatedImages, noLabeledImages, selectedModel]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      annotatedImages.length > 0
    ) {
      const trainingSize = Math.round(
        annotatedImages.length * trainingPercentage
      );
      const validationSize = annotatedImages.length - trainingSize;

      console.log(
        `Set training size to Round[${annotatedImages.length} * ${trainingPercentage}] = ${trainingSize}`,
        `; val size to ${annotatedImages.length} - ${trainingSize} = ${validationSize}`
      );

      console.log(
        `Set training batches per epoch to RoundUp[${trainingSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(trainingSize / fitOptions.batchSize)}`
      );

      console.log(
        `Set validation batches per epoch to RoundUp[${validationSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(validationSize / fitOptions.batchSize)}`
      );

      console.log(
        `Training last batch size is ${trainingSize % fitOptions.batchSize}`,
        `; validation is ${validationSize % fitOptions.batchSize}`
      );
    }
  }, [fitOptions.batchSize, trainingPercentage, annotatedImages.length]);

  const trainingHistoryCallback: TrainingCallbacks["onEpochEnd"] = async (
    epoch,
    logs
  ) => {
    const nextEpoch = totalEpochs + epoch + 1;
    const trainingEpochIndicator = nextEpoch - 0.5;

    setTotalEpochs(nextEpoch);
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

  const cleanUpStates = () => {
    setTrainingAccuracy([]);
    setValidationAccuracy([]);
    setTrainingLoss([]);
    setValidationLoss([]);
    setShowPlots(false);

    setCurrentEpoch(0);
  };

  const onFit = async () => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      cleanUpStates();

      dispatch(
        segmenterSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
          execSaga: true,
        })
      );
    } else {
      dispatch(
        segmenterSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
          execSaga: true,
        })
      );
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransitionSlide}
      style={{ zIndex: 1203, height: "100%" }}
    >
      <FitSegmenterDialogAppBar
        closeDialog={closeDialog}
        fit={onFit}
        disableFitting={noLabeledImages || !selectedModel.trainable}
        epochs={fitOptions.epochs}
        currentEpoch={currentEpoch}
      />

      {showWarning && noLabeledImages && selectedModel.trainable && (
        <AlertDialog
          setShowAlertDialog={setShowWarning}
          alertState={noLabeledImageAlert}
        />
      )}

      {alertState.visible && <AlertDialog alertState={alertState} />}

      <DialogContent>
        <List dense>
          <SegmenterArchitectureSettingsListItem />

          <OptimizerSettingsListItem
            compileOptions={compileOptions}
            dispatchLossFunctionCallback={dispatchLossFunctionCallback}
            dispatchOptimizationAlgorithmCallback={
              dispatchOptimizationAlgorithmCallback
            }
            dispatchEpochsCallback={dispatchEpochsCallback}
            fitOptions={fitOptions}
            dispatchBatchSizeCallback={dispatchBatchSizeCallback}
            dispatchLearningRateCallback={dispatchLearningRateCallback}
            isModelTrainable={selectedModel.trainable}
          />

          <DatasetSettingsListItem
            trainingPercentage={trainingPercentage}
            dispatchTrainingPercentageCallback={
              dispatchTrainingPercentageCallback
            }
            isModelTrainable={selectedModel.trainable}
          />
        </List>

        {showPlots && (
          <div>
            <TrainingHistoryPlot
              metric={"accuracy"}
              trainingValues={trainingAccuracy}
              validationValues={validationAccuracy}
            />

            <TrainingHistoryPlot
              metric={"loss"}
              trainingValues={trainingLoss}
              validationValues={validationLoss}
              dynamicYRange={true}
            />
          </div>
        )}

        {modelStatus > ModelStatus.Training && !selectedModel.graph && (
          <div>
            {/*  TODO - segmenter: implement model summary for graph */}
            <ModelSummaryTable model={selectedModel} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
