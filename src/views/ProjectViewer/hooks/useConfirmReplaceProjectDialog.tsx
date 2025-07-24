import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
} from "@mui/material";
import React, { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { selectShowSaveProjectDialog } from "store/applicationSettings/selectors";

const ConfirmReplaceDialog = ({
  open,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  onConfirm: (result: boolean) => void;
  onDismiss: () => void;
}) => {
  const dispatch = useDispatch();
  const showSaveProjectDialog = useSelector(selectShowSaveProjectDialog);
  const handleToggleSaveDialog = () => {
    dispatch(
      applicationSettingsSlice.actions.setShowSaveProjectDialog({
        show: !showSaveProjectDialog,
      })
    );
  };
  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      data-testid="confirm-replace-dialog"
    >
      <DialogTitle>{"Current Project will be lost"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {
            "Opening another project will cause the the current project data to be lost. Do you want to continue?"
          }
        </DialogContentText>
        <FormControl size="small">
          <FormControlLabel
            sx={(theme) => ({
              fontSize: theme.typography.body2.fontSize,
              width: "max-content",
              ml: 0,
            })}
            control={
              <Checkbox
                checked={!showSaveProjectDialog}
                onChange={handleToggleSaveDialog}
                color="primary"
              />
            }
            label="Dont show this dialog again"
            disableTypography
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Cancel</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => onConfirm(true)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ConfirmReplaceDialogContext = React.createContext<{
  openDialog: ({ actionCallback }: { actionCallback: any }) => void;
}>({
  openDialog: (_config) => {},
});

const ConfirmReplaceDialogProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const showSaveProjectDialog = useSelector(selectShowSaveProjectDialog);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<{
    actionCallback: any;
  }>({ actionCallback: undefined });

  const openDialog = ({ actionCallback }: { actionCallback: any }) => {
    if (!showSaveProjectDialog) {
      actionCallback(true);
      return;
    }
    setDialogOpen(true);
    setDialogConfig({ actionCallback });
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setDialogConfig({
      actionCallback: undefined,
    });
  };

  const onConfirm = (result: boolean) => {
    resetDialog();
    dialogConfig.actionCallback(result);
  };

  const onDismiss = () => {
    resetDialog();
    dialogConfig.actionCallback(false);
  };

  return (
    <ConfirmReplaceDialogContext.Provider value={{ openDialog }}>
      <ConfirmReplaceDialog
        open={dialogOpen}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
      {children}
    </ConfirmReplaceDialogContext.Provider>
  );
};

const useConfirmReplaceDialog = () => {
  const { openDialog } = React.useContext(ConfirmReplaceDialogContext);

  const getConfirmation = (
    options: Omit<Parameters<typeof openDialog>[0], "actionCallback">
  ): Promise<boolean> =>
    new Promise((res) => {
      openDialog({
        actionCallback: res,
        ...options,
      });
    });

  return { getConfirmation };
};

export default ConfirmReplaceDialog;
export { ConfirmReplaceDialogProvider, useConfirmReplaceDialog };
