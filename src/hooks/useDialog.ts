import { useCallback, useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectAlertState } from "store/applicationSettings/selectors";

import { AlertType } from "utils/enums";

import type { HotkeyContext } from "utils/enums";

export const useDialog = (closeOnError: boolean = true) => {
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
  const { onClose, onOpen, open } = useDialog(closeOnError);

  // Keep the hotkey context registered exactly while the dialog is open, so
  // closing by any path (onClose, an error alert, unmount) unregisters it.
  useEffect(() => {
    if (!open || !view) return;
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({ context: view }),
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: view,
        }),
      );
    };
  }, [open, view, dispatch]);

  return { onClose, onOpen, open };
};
