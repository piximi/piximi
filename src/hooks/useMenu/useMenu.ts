import { useCallback, useState } from "react";

export const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const onOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return { anchorEl, onClose, onOpen, open };
};
