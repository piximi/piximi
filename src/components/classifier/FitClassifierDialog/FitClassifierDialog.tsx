import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { ClassifierArchitectureSettingsListItem } from "../ClassifierArchitectureSettingsListItem";
import { PreprocessingSettingsListItem } from "../PreprocessingSettingsListItem/PreprocessingSettingsListItem";

import {
  ModelSummaryTable,
  TrainingHistoryPlot,
} from "components/common/styled-components";
import { OptimizerSettingsListItem } from "components/common/list-items/OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "components/common/list-items/DatasetSettingsListItem/DatasetSettingsListItem";
import { AlertDialog, DialogTransition } from "components/common/dialogs/";

import { alertStateSelector } from "store/application";
import {
  classifierSelectedModelSelector,
  classifierModelStatusSelector,
  classifierCompileOptionsSelector,
  classifierFitOptionsSelector,
  classifierTrainingPercentageSelector,
  classifierSlice,
} from "store/classifier";
import { selectImagesByPartitions } from "store/data";

import {
  AlertStateType,
  AlertType,
  OptimizationAlgorithm,
  LossFunction,
  Partition,
} from "types";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";
import { LayersModel } from "@tensorflow/tfjs";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

//TODO: need full inference images here, or just count?
export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const dispatch = useDispatch();

  const { closeDialog, openedDialog } = props;

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [totalEpochs, setTotalEpochs] = useState<number>(0);

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

  const categorizedImages = useSelector(selectImagesByPartitions)([
    Partition.Inference,
  ]);

  const selectedModel = useSelector(classifierSelectedModelSelector);
  const modelStatus = useSelector(classifierModelStatusSelector);
  const alertState = useSelector(alertStateSelector);

  const fitOptions = useSelector(classifierFitOptionsSelector);
  const compileOptions = useSelector(classifierCompileOptionsSelector);
  const trainingPercentage = useSelector(classifierTrainingPercentageSelector);

  const dispatchBatchSizeCallback = (batchSize: number) => {
    dispatch(classifierSlice.actions.updateBatchSize({ batchSize: batchSize }));
  };

  const dispatchLearningRateCallback = (learningRate: number) => {
    dispatch(
      classifierSlice.actions.updateLearningRate({ learningRate: learningRate })
    );
  };

  const dispatchEpochsCallback = (epochs: number) => {
    dispatch(classifierSlice.actions.updateEpochs({ epochs: epochs }));
  };

  const dispatchOptimizationAlgorithmCallback = (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => {
    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  const dispatchLossFunctionCallback = (lossFunction: LossFunction) => {
    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: lossFunction,
      })
    );
  };

  const dispatchTrainingPercentageCallback = (trainPercentage: number) => {
    dispatch(
      classifierSlice.actions.updateTrainingPercentage({
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

  return (
    <Dialog
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <FitClassifierDialogAppBar
        closeDialog={closeDialog}
        fit={onFit}
        disableFitting={noCategorizedImages || !selectedModel.trainable}
        epochs={fitOptions.epochs}
        currentEpoch={currentEpoch}
      />

      {showWarning && noCategorizedImages && selectedModel.trainable && (
        <AlertDialog
          setShowAlertDialog={setShowWarning}
          alertState={noLabeledImageAlert}
        />
      )}

      {alertState.visible && <AlertDialog alertState={alertState} />}

      <DialogContent>
        <List dense>
          <PreprocessingSettingsListItem />

          <ClassifierArchitectureSettingsListItem />

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

        {modelStatus > ModelStatus.Training && (
          <div>
            {/*  TODO - segmenter: pass in actual model class */}
            <ModelSummaryTable
              loadedModel={selectedModel._model! as LayersModel}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
