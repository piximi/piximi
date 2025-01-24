import React, { useCallback, useState } from "react";

export const useMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [open, setOpen] = useState<boolean>(false);

  const onClose = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, []);

  const onOpen = useCallback(
    (event: React.MouseEvent<HTMLElement> | HTMLElement) => {
      setOpen(true);
      if (event instanceof HTMLElement) {
        setAnchorEl(event);
        return;
      }
      setAnchorEl(event.currentTarget);
    },
    []
  );

  return {
    anchorEl,
    onClose,
    onOpen,
    open,
  };
};
