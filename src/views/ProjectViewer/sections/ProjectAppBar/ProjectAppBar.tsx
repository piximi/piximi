import { Box, Divider, Stack } from "@mui/material";

import { useMobileView } from "hooks";

import { Logo } from "components/ui";

import { DIMENSIONS } from "utils/constants";

import { ExperimentNameTextField } from "./ExperimentNameTextField";
import { ImageViewerButton, MeasurementsButton } from "../../components";

export const ProjectAppBar = () => {
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
        pr: isMobile ? "default" : `${DIMENSIONS.toolDrawerWidth}px`,
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
        <Logo width={175} height={DIMENSIONS.toolDrawerWidth - 8} />
      </Box>

      <ExperimentNameTextField />

      <Box sx={{ flexGrow: 1 }} />

      {!isMobile && (
        <>
          <ImageViewerButton mobileAlt={true} />
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
