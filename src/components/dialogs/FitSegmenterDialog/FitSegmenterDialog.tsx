import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  List,
} from "@mui/material";

import {
  OptimizerSettingsListItem,
  DatasetSettingsListItem,
  SegmenterArchitectureSettingsListItem,
} from "components/list-items";
import { TrainingHistoryPlot } from "components/styled-components/TrainingHistoryPlot/TrainingHistoryPlot";
import { DialogTransitionSlide, AlertDialog } from "components/dialogs";
import { FitSegmenterDialogAppBar } from "components/app-bars";
import { ModelSummaryTable } from "components/styled-components";

import { selectAlertState } from "store/application";
import { selectAnnotatedImages } from "store/data";
import {
  selectSegmenterFitOptions,
  selectSegmenterCompileOptions,
  selectSegmenterTrainingPercentage,
  segmenterSlice,
  selectSegmenterModel,
  selectSegmenterModelStatus,
  selectSegmenterInputShape,
  selectSegmenterHistory,
} from "store/segmenter";

import {
  AlertStateType,
  AlertType,
  LossFunction,
  OptimizationAlgorithm,
} from "types";
import { TrainingCallbacks } from "utils/common/models/Model";
import { ModelStatus, availableSegmenterModels } from "types/ModelType";
import { useDialog } from "hooks";

enum ClearOptions {
  cancel,
  no,
  yes,
}

type FitSegmenterDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitSegmenterDialog = (props: FitSegmenterDialogProps) => {
  const dispatch = useDispatch();

  const { closeDialog, openedDialog } = props;

  const {
    onClose: onCloseClearDialog,
    open: openClearDialog,
    onOpen: onOpenClearDialog,
  } = useDialog();

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);

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

  const [nextModelIdx, setNextModelIdx] = useState(0);

  const [clearModel, setClearModel] = useState(ClearOptions.no);

  const annotatedImages = useSelector(selectAnnotatedImages);
  const selectedModel = useSelector(selectSegmenterModel);
  const inputShape = useSelector(selectSegmenterInputShape);
  const modelStatus = useSelector(selectSegmenterModelStatus);
  const alertState = useSelector(selectAlertState);

  const fitOptions = useSelector(selectSegmenterFitOptions);
  const compileOptions = useSelector(selectSegmenterCompileOptions);
  const trainingPercentage = useSelector(selectSegmenterTrainingPercentage);

  const items = useRef([
    "loss",
    "val_loss",
    "categoricalAccuracy",
    "val_categoricalAccuracy",
    "epochs",
  ]);

  const modelHistory = useSelector((state) =>
    selectSegmenterHistory(state, items.current)
  );

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
    name: "No annotated images",
    description: "Please annotate images to train a model.",
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

  const onFit = async () => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
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

  const dispatchModel = (disposePrevious: boolean, _nextModelIdx: number) => {
    dispatch(
      segmenterSlice.actions.updateSelectedModelIdx({
        modelIdx: _nextModelIdx,
        disposePrevious,
      })
    );

    const nextModel = availableSegmenterModels[_nextModelIdx];

    // if the selected model requires a specific number of input channels,
    // dispatch that number to the store
    if (nextModel.requiredChannels) {
      dispatch(
        segmenterSlice.actions.updateSegmentationInputShape({
          inputShape: {
            ...inputShape,
            channels: nextModel.requiredChannels,
          },
        })
      );
    }
  };

  const dispatchModelOnExit = () => {
    if (clearModel !== ClearOptions.cancel) {
      dispatchModel(clearModel === ClearOptions.yes, nextModelIdx);
    }
  };

  const onClearSelect = (_clearModel: ClearOptions) => {
    onCloseClearDialog();
    // don't call dispatchModel directly here
    // it needs to be triggered on dialog exit
    setClearModel(_clearModel);
  };

  const onModelSelect = (modelIdx: number) => {
    setNextModelIdx(modelIdx);
    if (selectedModel.modelLoaded) {
      onOpenClearDialog();
    } else {
      // if not loaded skip the clear dialog
      dispatchModel(false, modelIdx);
    }
  };

  return (
    <>
      <Dialog
        onClose={onCloseClearDialog}
        open={openClearDialog}
        TransitionComponent={Fade}
        TransitionProps={{ onExited: dispatchModelOnExit }}
      >
        <DialogTitle> Clear {selectedModel.name}?</DialogTitle>
        <DialogActions>
          <Button onClick={() => onClearSelect(ClearOptions.cancel)}>
            Cancel
          </Button>
          <Button onClick={() => onClearSelect(ClearOptions.no)}>No</Button>
          <Button onClick={() => onClearSelect(ClearOptions.yes)}>Yes</Button>
        </DialogActions>
      </Dialog>
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
          noLabels={noLabeledImages}
          noTrain={!selectedModel.trainable}
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
            <SegmenterArchitectureSettingsListItem
              onModelSelect={onModelSelect}
            />

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
              {/*  TODO: implement model summary for graph models */}
              <ModelSummaryTable model={selectedModel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
