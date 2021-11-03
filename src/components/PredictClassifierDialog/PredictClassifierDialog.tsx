import * as React from "react";
import { useDispatch } from "react-redux";
import { Dialog, DialogContent, List } from "@mui/material";
import { classifierSlice } from "../../store/slices";
import { PreprocessingSettingsListItem } from "../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DialogTransition } from "../DialogTransition";
import { PredictClassifierDialogAppBar } from "./PredictClassifierDialogAppBar";

type PredictClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const PredictClassifierDialog = (
  props: PredictClassifierDialogProps
) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  const dispatch = useDispatch();

  const onPredict = async () => {
    dispatch(classifierSlice.actions.predict({}));
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
      <PredictClassifierDialogAppBar
        closeDialog={closeDialog}
        fit={onPredict}
        openedDrawer={openedDrawer}
      />

      <DialogContent>
        <List dense>
          <PreprocessingSettingsListItem
            closeDialog={closeDialog}
            openedDialog={openedDialog}
          />
        </List>
      </DialogContent>
    </Dialog>
  );
};
