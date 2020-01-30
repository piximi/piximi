import Dialog from "@material-ui/core/Dialog/Dialog";
import * as React from "react";

import {FitClassifierDialogAppBar} from "../FitClassifierDialogAppBar";
import {FitClassifierDialogContent} from "../FitClassifierDialogContent";

type FitClassifierDialog = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog
}: FitClassifierDialog) => {
  return (
    <Dialog fullScreen onClose={closeDialog} open={openedDialog}>
      <FitClassifierDialogAppBar closeDialog={closeDialog} />

      <FitClassifierDialogContent />
    </Dialog>
  );
};
