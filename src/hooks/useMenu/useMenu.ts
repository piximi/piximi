import React, { useCallback, useRef, useState } from "react";

export const useMenu = () => {
  const anchorEl = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState<boolean>(false);

  const onClose = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (
        anchorEl.current &&
        anchorEl.current.contains(event.target as HTMLElement)
      )
        return;

      setOpen(false);
    },
    []
  );

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  return {
    anchorEl,
    onClose,
    onOpen,
    open,
  };
};
