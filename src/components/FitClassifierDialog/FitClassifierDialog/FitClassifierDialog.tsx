import { Dialog, DialogContent, List } from "@material-ui/core";
import * as React from "react";
import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { DialogTransition } from "../DialogTransition";
import { ClassifierSettingsListItem } from "../ClassifierSettingsListItem/ClassifierSettingsListItem";
// additional stuff to test
import { PreprocessingSettingsListItem } from "../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { train_mnist } from "./fit_mnist";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../../store/slices";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  const dispatch = useDispatch();

  const onFit = async () => {
    // const history = await train_mnist();
    dispatch(classifierSlice.actions.fit({ onEpochEnd: 4 }));

    //this should be history = await train()
    // console.info(history);
  };

  // specifies interface
  return (
    // @ts-ignore
    <Dialog
      disableBackdropClick
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

          <ClassifierSettingsListItem />

          <DatasetSettingsListItem />
        </List>
        <div id={"vis-train-container"} />
      </DialogContent>
    </Dialog>
  );
};
