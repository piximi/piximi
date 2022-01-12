import * as React from "react";
import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { OptimizerSettingsListItem } from "../OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice, projectSlice } from "../../../store/slices";
import { Alert, Dialog, DialogContent, List } from "@mui/material";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { PreprocessingSettingsListItem } from "../../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DialogTransition } from "../../DialogTransition";
import {
  categorizedImagesSelector,
  trainingPercentageSelector,
} from "../../../store/selectors";
import { Image } from "../../../types/Image";
import * as _ from "lodash";
import { Partition } from "../../../types/Partition";
import { useEffect, useState } from "react";
import { TrainingHistoryPlot } from "../TrainingHistoryPlot/TrainingHistoryPlot";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  const [noCategorizedImagesAlert, setNoCategorizedImagesAlert] =
    useState<boolean>(false);
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

  const trainingPercentage = useSelector(trainingPercentageSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);

  useEffect(() => {
    setNoCategorizedImagesAlert(categorizedImages.length === 0);
  }, [categorizedImages]);

  const dispatch = useDispatch();

  const trainingHistoryCallback = (epoch: number, logs: any) => {
    const epoch_ = ++epoch;
    setTrainingAccuracy((prevState) =>
      prevState.concat({ x: epoch_, y: logs.categoricalAccuracy })
    );
    setValidationAccuracy((prevState) =>
      prevState.concat({ x: epoch_, y: logs.val_categoricalAccuracy })
    );
    setTrainingLoss((prevState) =>
      prevState.concat({ x: epoch_, y: logs.loss })
    );
    setValidationLoss((prevState) =>
      prevState.concat({ x: epoch_, y: logs.val_loss })
    );

    setShowPlots(true);
  };

  const cleanUpStates = () => {
    setTrainingAccuracy([]);
    setValidationAccuracy([]);
    setTrainingLoss([]);
    setValidationLoss([]);
    setShowPlots(false);
  };

  const onFit = async () => {
    cleanUpStates();

    //first assign train and val partition to all categorized images
    const categorizedImagesIds = _.shuffle(categorizedImages).map(
      (image: Image) => {
        return image.id;
      }
    );

    //separate ids into train and val datasets
    const trainDataLength = Math.round(
      trainingPercentage * categorizedImagesIds.length
    );
    const valDataLength = categorizedImagesIds.length - trainDataLength;

    const trainDataIds = _.take(categorizedImagesIds, trainDataLength);
    const valDataIds = _.takeRight(categorizedImagesIds, valDataLength);

    dispatch(
      projectSlice.actions.updateImagesPartition({
        ids: trainDataIds,
        partition: Partition.Training,
      })
    );
    dispatch(
      projectSlice.actions.updateImagesPartition({
        ids: valDataIds,
        partition: Partition.Validation,
      })
    );

    dispatch(
      classifierSlice.actions.fit({
        onEpochEnd: trainingHistoryCallback,
      })
    );
  };

  // specifies interface
  return (
    // @ts-ignore
    <Dialog
      disableEscapeKeyDown
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <FitClassifierDialogAppBar
        closeDialog={closeDialog}
        fit={onFit}
        openedDrawer={openedDrawer}
        disableFitting={noCategorizedImagesAlert}
      />

      {noCategorizedImagesAlert && showWarning ? (
        <Alert
          onClose={() => {
            setShowWarning(false);
          }}
          severity="info"
        >
          {"Please label images to train a model."}
        </Alert>
      ) : (
        <></>
      )}

      <DialogContent>
        <List dense>
          <PreprocessingSettingsListItem
            closeDialog={closeDialog}
            openedDialog={openedDialog}
          />

          <ArchitectureSettingsListItem />

          <OptimizerSettingsListItem />

          <DatasetSettingsListItem />
        </List>

        {showPlots ? (
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
        ) : (
          <></>
        )}

        <div id={"tfvis-container"} />
      </DialogContent>
    </Dialog>
  );
};
