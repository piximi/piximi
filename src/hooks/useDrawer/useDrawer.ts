import { useCallback, useState } from "react";

export const useDrawer = () => {
  const [open, setOpen] = useState(true);

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open]);

  return { open, toggle };
};
