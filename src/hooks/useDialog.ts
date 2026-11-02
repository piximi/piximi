import { useCallback, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectAlertState } from "store/applicationSettings/selectors";

import { AlertType } from "utils/enums";

import type { HotkeyContext } from "utils/enums";

export const useDialog = (
  closeOnError: boolean = true,
  onForceClose?: () => void,
) => {
  const alertState = useSelector(selectAlertState);
  const [open, setOpen] = useState(false);

  const [prevAlert, setPrevAlert] = useState(alertState);
  if (alertState !== prevAlert) {
    setPrevAlert(alertState);
    if (
      closeOnError &&
      alertState.visible &&
      alertState.alertType === AlertType.Error
    ) {
      onForceClose && onForceClose();
      setOpen(false);
    }
  }

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  return { onClose, onOpen, open };
};

export const useDialogHotkey = (
  view?: HotkeyContext,
  closeOnError: boolean = true,
) => {
  const dispatch = useDispatch();
  const {
    onClose: onDialogClose,
    onOpen: onDialogOpen,
    open: dialogOpen,
  } = useDialog(closeOnError, () => {
    view &&
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: view,
        }),
      );
  });

  const onOpen = () => {
    view &&
      dispatch(
        applicationSettingsSlice.actions.registerHotkeyContext({
          context: view,
        }),
      );
    onDialogOpen();
  };

  const onClose = () => {
    view &&
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: view,
        }),
      );
    onDialogClose();
  };

  return { onClose, onOpen, open: dialogOpen };
};
