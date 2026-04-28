import React from "react";

import { useSelector } from "react-redux";

import { Box, Divider, Stack } from "@mui/material";

import { useMobileView } from "hooks";

import { LogoLoader } from "components/ui";

import { selectOverallTaskProgress } from "store/appTasks/selectors";

import { DIMENSIONS } from "utils/constants";

import { ExperimentNameTextField } from "./ExperimentNameTextField";
import { ImageViewerButton, MeasurementsButton } from "../../components";

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
          {/*
            TODO: selectedThings will be removed during refactor
           */}
          <ImageViewerButton selectedThings={[]} mobileAlt={true} />
          <Divider
            orientation="vertical"
            flexItem
            variant="middle"
            sx={{ mx: 1 }}
          />
          <MeasurementsButton mobileAlt={true} />
        </>
      )}
    </Stack>
  );
};
