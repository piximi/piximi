import React from "react";
import { useSelector } from "react-redux";

import { Box, Divider, Stack } from "@mui/material";

import { useMobileView } from "hooks";

import { LogoLoader } from "components/ui";
import { ZoomControl } from "./ZoomControl";
import { ProjectTextField } from "./ProjextTextField";
import { CategorizeChip } from "./CategorizeChip";

import { selectLoadPercent } from "store/applicationSettings/selectors";

import { ImageViewerButton } from "./ImageViewerButton";
import { MeasurementsButton } from "./MeasurementsButton";
import { DIMENSIONS } from "utils/constants";
import { ItemSelection } from "./ItemSelection";

export const ProjectAppBar = () => {
  const loadPercent = useSelector(selectLoadPercent);
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
          minWidth: isMobile ? undefined : DIMENSIONS.leftDrawerWidth - 8,
        }}
      >
        <LogoLoader
          width={175}
          height={DIMENSIONS.toolDrawerWidth - 8}
          loadPercent={loadPercent}
        />
      </Box>

      <ProjectTextField />

      <Box sx={{ flexGrow: 1 }} />

      <ItemSelection />
      {isMobile ? (
        <ZoomControl />
      ) : (
        <>
          <ZoomControl />

          <Divider
            variant="middle"
            orientation="vertical"
            flexItem
            sx={{ mr: 2 }}
          />
          <CategorizeChip />
          <Divider
            variant="middle"
            orientation="vertical"
            flexItem
            sx={{ mr: 2 }}
          />
          <ImageViewerButton />
          <MeasurementsButton />
        </>
      )}
    </Stack>
  );
};
