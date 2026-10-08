import { Stack } from "@mui/material";

import { DIMENSIONS } from "utils/constants";

import { MeasurementsLogo } from "./MeasurementsLogo";

export const MeasurementsTopBar = () => {
  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        justifyContent: "flex-start",
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-bar",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
      })}
    >
      <MeasurementsLogo />
    </Stack>
  );
};
