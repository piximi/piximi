import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog, DialogContent, List } from "@mui/material";

import { ModelSummaryTable } from "./ModelSummary/ModelSummary";

import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { OptimizerSettingsListItem } from "../OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { TrainingHistoryPlot } from "../TrainingHistoryPlot/TrainingHistoryPlot";

import { AlertDialog } from "components/common/dialogs/AlertDialog/AlertDialog";
import { PreprocessingSettingsListItem } from "components/classifier/PreprocessingSettingsListItem";
import { DialogTransition } from "components/common/DialogTransition";

import {
  alertStateSelector,
  categorizedImagesSelector,
  compiledSelector,
  epochsSelector,
  trainingFlagSelector,
} from "store/selectors";

import { classifierSlice } from "store/slices";

import { AlertStateType, AlertType } from "types";

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

  const currentlyTraining = useSelector(trainingFlagSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);
  const compiledModel = useSelector(compiledSelector);
  const alertState = useSelector(alertStateSelector);

  const epochs = useSelector(epochsSelector);

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
      })
    );
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

          <OptimizerSettingsListItem />

          <DatasetSettingsListItem />
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
