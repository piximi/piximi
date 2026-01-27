import { Stack } from "@mui/material";
import { MeasurementsLogo } from "./MeasurementsLogo";
import { DIMENSIONS } from "utils/constants";

export const MeasurementsTopBar = () => {
  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      sx={(theme) => ({
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
