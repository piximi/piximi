import { useCallback, useState } from "react";

export const useSnackbar = () => {
  const [openedSnackbar, setOpenedSnackbar] = useState(false);

  const closeSnackbar = useCallback(() => {
    setOpenedSnackbar(false);
  }, []);

  const openSnackbar = useCallback(() => {
    setOpenedSnackbar(true);
  }, []);

  return {
    closeSnackbar,
    openedSnackbar,
    openSnackbar,
  };
};
