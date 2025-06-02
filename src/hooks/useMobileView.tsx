import { useMediaQuery, useTheme } from "@mui/material";

export const useMobileView = () => {
  const theme = useTheme();

  const matches = useMediaQuery(theme.breakpoints.down("sm"));

  return matches;
};
