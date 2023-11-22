import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import { AlertBar, FitClassifierDialogAppBar } from "components/app-bars";

import { ModelSummaryTable, TwoDataPlot } from "components/data-viz";
import {
  ClassifierArchitectureListItem,
  ClassifierOptimizerListItem,
  ClassifierPreprocessingListItem,
  ClassifierDatasetListItem,
} from "components/list-items";
import { DialogTransitionSlide } from "components/dialogs";

import { selectAlertState } from "store/applicationSettings";
import {
  selectClassifierSelectedModel,
  selectClassifierHistory,
  selectClassifierModelStatus,
  selectClassifierFitOptions,
  selectClassifierTrainingPercentage,
  classifierSlice,
} from "store/classifier";
import { selectImagesByPartitions } from "store/data";

import { AlertStateType, AlertType, Partition } from "types";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

const historyItems = [
  "loss",
  "val_loss",
  "categoricalAccuracy",
  "val_categoricalAccuracy",
  "epochs",
];

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const dispatch = useDispatch();

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(true);

  const [noCategorizedImages, setNoCategorizedImages] =
    useState<boolean>(false);
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

  //TODO: need full inference images here, or just count?
  const categorizedImages = useSelector(selectImagesByPartitions)([
    Partition.Training,
    Partition.Validation,
  ]);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const modelStatus = useSelector(selectClassifierModelStatus);
  const alertState = useSelector(selectAlertState);
  const fitOptions = useSelector(selectClassifierFitOptions);
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);
  const modelHistory = useSelector((state) =>
    selectClassifierHistory(state, historyItems)
  );
  const noLabeledImageAlert: AlertStateType = {
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

  const onFit = async () => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: trainingHistoryCallback,
          execSaga: true,
        })
      );
    } else {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          modelStatus: ModelStatus.Training,
          onEpochEnd: trainingHistoryCallback,
          execSaga: true,
        })
      );
    }
  };

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      categorizedImages.length > 0
    ) {
      const trainingSize = Math.round(
        categorizedImages.length * trainingPercentage
      );
      const validationSize = categorizedImages.length - trainingSize;

      console.log(
        `Set training size to Round[${categorizedImages.length} * ${trainingPercentage}] = ${trainingSize}`,
        `; val size to ${categorizedImages.length} - ${trainingSize} = ${validationSize}`
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
  }, [fitOptions.batchSize, trainingPercentage, categorizedImages.length]);

  useEffect(() => {
    if (categorizedImages.length === 0) {
      setNoCategorizedImages(true);
      if (!noCategorizedImages && selectedModel.trainable) {
        setShowWarning(true);
      }
    } else {
      setNoCategorizedImages(false);
    }
  }, [categorizedImages, noCategorizedImages, selectedModel]);

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
        <FitClassifierDialogAppBar
          closeDialog={closeDialog}
          fit={onFit}
          noLabels={noCategorizedImages}
          noTrain={!selectedModel.trainable}
          epochs={fitOptions.epochs}
          currentEpoch={currentEpoch}
        />

        {showWarning && noCategorizedImages && selectedModel.trainable && (
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledImageAlert}
          />
        )}

        {alertState.visible && <AlertBar alertState={alertState} />}

        <DialogContent>
          <List dense>
            <ClassifierPreprocessingListItem />

            <ClassifierArchitectureListItem />

            <ClassifierOptimizerListItem
              fitOptions={fitOptions}
              trainable={selectedModel.trainable}
            />

            <ClassifierDatasetListItem
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
          {/* TODO: implement model summary for graph models */}
          {modelStatus > ModelStatus.Training && !selectedModel.graph && (
            <div>
              <ModelSummaryTable model={selectedModel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
