import * as React from "react";
import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { DialogTransition } from "../DialogTransition";
import { OptimizerSettingsListItem } from "../OptimizerSettingsListItem/OptimizerSettingsListItem";
// additional stuff to test
import { PreprocessingSettingsListItem } from "../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../../store/slices";
import { Dialog, DialogContent, List } from "@mui/material";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  const dispatch = useDispatch();

  const onFit = async () => {
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
