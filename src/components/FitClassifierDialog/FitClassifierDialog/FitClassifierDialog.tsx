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

  const trainingPercentage = useSelector(trainingPercentageSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);

  useEffect(() => {
    setNoCategorizedImagesAlert(categorizedImages.length === 0);
  }, [categorizedImages]);

  const dispatch = useDispatch();

  const onFit = async () => {
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
        onEpochEnd: (epoch: number, logs: any) => {
          console.info(logs);
          console.info(epoch + ":" + logs.loss);
        },
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
        <div id={"tfvis-container"} />
      </DialogContent>
    </Dialog>
  );
};
