import React from "react";
import { useSelector } from "react-redux";

import { Box, Stack } from "@mui/material";

import { useMobileView } from "hooks";

import { LogoLoader } from "components/ui";
import { ExperimentNameTextField } from "./ExperimentNameTextField";
import { ImageViewerButton } from "./ImageViewerButton";
import { MeasurementsButton } from "./MeasurementsButton";
import { DIMENSIONS } from "utils/constants";
import { selectOverallTaskProgress } from "store/appTasks/selectors";

export const ProjectAppBar = () => {
  const taskProgress = useSelector(selectOverallTaskProgress);
  const isMobile = useMobileView();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-tools",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
        px: 1,
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          width: isMobile ? undefined : DIMENSIONS.leftDrawerWidth - 8,
        }}
      >
        <LogoLoader
          width={175}
          height={DIMENSIONS.toolDrawerWidth - 8}
          loadPercent={taskProgress}
        />
      </Box>

      <ExperimentNameTextField />

      <Box sx={{ flexGrow: 1 }} />

      {!isMobile && (
        <>
          {/**
           * TODO: selectedThings will be removed during refactor
           */}
          <ImageViewerButton selectedThings={[]} />
          <MeasurementsButton />
        </>
      )}
    </Stack>
  );
};
