import { Box, useTheme } from "@mui/material";

import { DIMENSIONS } from "utils/constants";

export const MeasurementsSideBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-bar",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1002,
      }}
    ></Box>
  );
};
