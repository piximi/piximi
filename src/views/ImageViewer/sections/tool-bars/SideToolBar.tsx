import { useTheme, Box } from "@mui/material";

import { DIMENSIONS } from "utils/constants";

import { ToolOptions } from "./tools";

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-tools",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1002,
      }}
    >
      <ToolOptions />
    </Box>
  );
};
