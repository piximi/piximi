import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectAlertState } from "store/applicationSettings/selectors";
import { AlertType, HotkeyContext } from "utils/common/enums";

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
  view?: HotkeyContext,
  closeOnError: boolean = true
) => {
  const dispatch = useDispatch();
  const {
    onClose: onDialogClose,
    onOpen: onDialogOpen,
    open: dialogOpen,
  } = useDialog(closeOnError);

  const onOpen = () => {
    view &&
      dispatch(
        applicationSettingsSlice.actions.registerHotkeyContext({
          context: view,
        })
      );
    onDialogOpen();
  };

  const onClose = () => {
    view &&
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: view,
        })
      );
    onDialogClose();
  };

  return { onClose, onOpen, open: dialogOpen };
};
