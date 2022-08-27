import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { PreprocessingSettingsListItem } from "../PreprocessingSettingsListItem/PreprocessingSettingsListItem";

import { ModelSummaryTable } from "components/common/ModelSummary";
import { OptimizerSettingsListItem } from "components/common/OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "components/common/DatasetSettingsListItem/DatasetSettingsListItem";
import { AlertDialog } from "components/common/AlertDialog/AlertDialog";
import { TrainingHistoryPlot } from "components/common/TrainingHistoryPlot";
import { DialogTransition } from "components/common/DialogTransition";

import { alertStateSelector, unregisterHotkeyView } from "store/application";
import {
  classifierTrainingFlagSelector,
  classifierCompiledSelector,
  classifierCompileOptionsSelector,
  classifierFitOptionsSelector,
  classifierEpochsSelector,
  classifierTrainingPercentageSelector,
  classifierSlice,
} from "store/classifier";
import { categorizedImagesSelector } from "store/project";

import {
  AlertStateType,
  AlertType,
  OptimizationAlgorithm,
  LossFunction,
} from "types";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const dispatch = useDispatch();

  const { closeDialog, openedDialog } = props;

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

  const currentlyTraining = useSelector(classifierTrainingFlagSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);
  const compiledModel = useSelector(classifierCompiledSelector);
  const alertState = useSelector(alertStateSelector);

  const compileOptions = useSelector(classifierCompileOptionsSelector);
  const fitOptions = useSelector(classifierFitOptionsSelector);
  const epochs = useSelector(classifierEpochsSelector);
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
      if (!noCategorizedImages) {
        setShowWarning(true);
      }
    } else {
      setNoCategorizedImages(false);
    }
  }, [categorizedImages, noCategorizedImages]);

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
        `Set training size to Round[${categorizedImages.length} * ${trainingPercentage}] = ${trainingSize}`
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
    }
  }, [fitOptions.batchSize, trainingPercentage, categorizedImages.length]);

  const trainingHistoryCallback = (epoch: number, logs: any) => {
    const epochCount = epoch + 1;
    const trainingEpochIndicator = epochCount - 0.5;
    setCurrentEpoch(epochCount);

    if (logs.categoricalAccuracy) {
      setTrainingAccuracy((prevState) =>
        prevState.concat({
          x: trainingEpochIndicator,
          y: logs.categoricalAccuracy,
        })
      );
    }
    if (logs.val_categoricalAccuracy) {
      setValidationAccuracy((prevState) =>
        prevState.concat({ x: epochCount, y: logs.val_categoricalAccuracy })
      );
    }
    if (logs.loss) {
      setTrainingLoss((prevState) =>
        prevState.concat({ x: trainingEpochIndicator, y: logs.loss })
      );
    }

    if (logs.val_loss) {
      setValidationLoss((prevState) =>
        prevState.concat({ x: epochCount, y: logs.val_loss })
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
    if (!currentlyTraining) {
      cleanUpStates();
    }

    dispatch(
      classifierSlice.actions.fit({
        onEpochEnd: trainingHistoryCallback,
        execSaga: true,
      })
    );
  };
  const closeAndUnregisterHotkey = () => {
    console.log("close Dialog");
    closeDialog();
    dispatch(unregisterHotkeyView({}));
  };

  return (
    <Dialog
      fullScreen
      onClose={closeAndUnregisterHotkey}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <FitClassifierDialogAppBar
        closeDialog={closeAndUnregisterHotkey}
        fit={onFit}
        disableFitting={noCategorizedImages}
        epochs={epochs}
        currentEpoch={currentEpoch}
      />

      {showWarning && noCategorizedImages && (
        <AlertDialog
          setShowAlertDialog={setShowWarning}
          alertState={noLabeledImageAlert}
        />
      )}

      {alertState.visible && <AlertDialog alertState={alertState} />}

      <DialogContent>
        <List dense>
          <PreprocessingSettingsListItem />

          <ArchitectureSettingsListItem />

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
          />

          <DatasetSettingsListItem
            trainingPercentage={trainingPercentage}
            dispatchTrainingPercentageCallback={
              dispatchTrainingPercentageCallback
            }
          />
        </List>

        {showPlots && (
          <div>
            <TrainingHistoryPlot
              metric={"accuracy"}
              currentEpoch={currentEpoch}
              trainingValues={trainingAccuracy}
              validationValues={validationAccuracy}
            />

            <TrainingHistoryPlot
              metric={"loss"}
              currentEpoch={currentEpoch}
              trainingValues={trainingLoss}
              validationValues={validationLoss}
              dynamicYRange={true}
            />
          </div>
        )}

        {compiledModel && (
          <div>
            <ModelSummaryTable compiledModel={compiledModel} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
