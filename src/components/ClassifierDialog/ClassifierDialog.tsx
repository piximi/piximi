import * as React from "react";
import { Dialog, DialogContent, List } from "@mui/material";
import { ClassifierDialogAppBar } from "./ClassifierDialogAppBar";
import { PredictClassifierListItem } from "../PredictClassifierListItem";
import { FitClassifierListItem } from "../FitClassifierListItem";
import { EvaluateClassifierListItem } from "../EvaluateClassifierListItem";

type ClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  openedDrawer: boolean;
};

export const ClassifierDialog = (props: ClassifierDialogProps) => {
  const { closeDialog, openedDialog, openedDrawer } = props;

  // specifies interface
  return (
    // @ts-ignore
    <Dialog
      disableEscapeKeyDown
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      style={{ zIndex: 1203 }}
    >
      <ClassifierDialogAppBar
        closeDialog={closeDialog}
        openedDrawer={openedDrawer}
      />

      <DialogContent>
        <List dense>
          <PredictClassifierListItem />

          <FitClassifierListItem />

          <EvaluateClassifierListItem />
        </List>
      </DialogContent>
    </Dialog>
  );
};
