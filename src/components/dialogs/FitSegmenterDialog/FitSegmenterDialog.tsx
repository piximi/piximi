import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import {
  SegmenterOptimizerListItem,
  SegmenterDatasetListItem,
  SegmenterArchitectureListItem,
} from "components/list-items";
import { TwoDataPlot, ModelSummaryTable } from "components/data-viz";
import { DialogTransitionSlide } from "components/dialogs";
import { FitSegmenterDialogAppBar, AlertBar } from "components/app-bars";

import { selectAlertState } from "store/slices/applicationSettings";
import { selectAnnotatedImages } from "store/slices/data";
import {
  selectSegmenterFitOptions,
  selectSegmenterTrainingPercentage,
  segmenterSlice,
  selectSegmenterModel,
  selectSegmenterModelStatus,
  selectSegmenterHistory,
} from "store/slices/segmenter";

import { AlertStateType, AlertType } from "types";
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
  const selectedModel = useSelector(selectSegmenterModel);
  const modelStatus = useSelector(selectSegmenterModelStatus);
  const alertState = useSelector(selectAlertState);

  const fitOptions = useSelector(selectSegmenterFitOptions);

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

  return (
    <>
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
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledImageAlert}
          />
        )}

        {alertState.visible && <AlertBar alertState={alertState} />}

        <DialogContent>
          <List dense>
            <SegmenterArchitectureListItem />

            <SegmenterOptimizerListItem
              fitOptions={fitOptions}
              trainable={selectedModel.trainable}
            />

            <SegmenterDatasetListItem
              trainingPercentage={trainingPercentage}
              trainable={selectedModel.trainable}
            />
          </List>

          {showPlots && (
            <div>
              <TwoDataPlot
                title="Training History - Accuracy per Epoch"
                yLabel="Accuracy"
                xLabel="Epoch"
                yData1={trainingAccuracy}
                id1="Accuracy"
                yData2={validationAccuracy}
                id2="Validation Accuracy"
              />

              <TwoDataPlot
                title="Training History - Loss per Epoch"
                yLabel="Loss"
                xLabel="Epoch"
                yData1={trainingLoss}
                id1="Loss"
                yData2={validationLoss}
                id2="Validation Loss"
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
