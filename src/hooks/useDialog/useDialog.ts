import React from "react";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { alertStateSelector } from "store/selectors/alertStateSelector";
import { AlertType } from "types/AlertStateType";

export const useDialog = (closeOnError: boolean = true) => {
  const [open, setOpen] = useState(false);

  const alertState = useSelector(alertStateSelector);

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
