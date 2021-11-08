import * as React from "react";
import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { OptimizerSettingsListItem } from "../OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice, projectSlice } from "../../../store/slices";
import { Dialog, DialogContent, List } from "@mui/material";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { PreprocessingSettingsListItem } from "../../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DialogTransition } from "../../DialogTransition";
import {
  categorizedImagesSelector,
  trainingPercentageSelector,
} from "../../../store/selectors";
import { Image } from "../../../types/Image";
import * as _ from "lodash";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  const trainingPercentage = useSelector(trainingPercentageSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);

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
        partition: 0,
      })
    );
    dispatch(
      projectSlice.actions.updateImagesPartition({
        ids: valDataIds,
        partition: 1,
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
      />

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
