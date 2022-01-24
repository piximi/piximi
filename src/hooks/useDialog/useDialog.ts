import { useState } from "react";

export const useDialog = () => {
  const [open, setOpen] = useState(false);

  const onClose = () => {
    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };

  return { onClose, onOpen, open };
};
