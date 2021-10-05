import { useCallback, useState } from "react";

export const useDialog = () => {
  const [open, setOpen] = useState(false);

  const onClose = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const onOpen = useCallback(() => {
    setOpen(!open);
  }, [open]);

  return { onClose, onOpen, open };
};
