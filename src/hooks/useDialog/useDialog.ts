import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectAlertState,
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/application";
import { AlertType, HotkeyView } from "types";

export const useDialog = (closeOnError: boolean = true) => {
  const [open, setOpen] = useState(false);

  const alertState = useSelector(selectAlertState);

  React.useEffect(() => {
    if (
      alertState.visible &&
      alertState.alertType === AlertType.Error &&
      closeOnError
    ) {
      setOpen(false);
    }
  }, [alertState, closeOnError]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  return { onClose, onOpen, open };
};

export const useDialogHotkey = (
  view?: HotkeyView,
  closeOnError: boolean = true
) => {
  const dispatch = useDispatch();
  const {
    onClose: onDialogClose,
    onOpen: onDialogOpen,
    open: dialogOpen,
  } = useDialog(closeOnError);

  const onOpen = () => {
    view && dispatch(registerHotkeyView({ hotkeyView: view }));
    onDialogOpen();
  };

  const onClose = () => {
    view && dispatch(unregisterHotkeyView({}));
    onDialogClose();
  };

  return { onClose, onOpen, open: dialogOpen };
};
