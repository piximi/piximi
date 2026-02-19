import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";

import { useMobileView } from "hooks";

import { LogoLoader } from "components/ui";
import { ZoomControl } from "./ZoomControl";
import { ProjectTextField } from "./ProjextTextField";
import { CategorizeChip } from "./CategorizeChip";

import { ImageViewerButton } from "./ImageViewerButton";
import { MeasurementsButton } from "./MeasurementsButton";
import { DIMENSIONS } from "utils/constants";
import { ItemSelection } from "./ItemSelection";
import { selectExpandedTime } from "store/project/selectors";
import { projectSlice } from "store/project";
import { selectItemsContainTimeSeries } from "store/project/reselectors";
import { CollapsedClockIcon, ExpandedClockIcon } from "icons/ClockIcon";
import { usePipelineProgress } from "contexts";

export const ProjectAppBar = () => {
  const isMobile = useMobileView();
  const dispatch = useDispatch();
  const theme = useTheme();
  const timeExpanded = useSelector(selectExpandedTime);
  const containsTimeSeries = useSelector(selectItemsContainTimeSeries);
  const pipelineProgress = usePipelineProgress();

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
          loadPercent={
            pipelineProgress.stage === "idle"
              ? 1
              : pipelineProgress.overallProgress / 100
          }
        />
      </Box>

      <ProjectTextField />

      <Box sx={{ flexGrow: 1 }} />
      <Tooltip title={`${timeExpanded ? "Collaps" : "Expand"} time-series`}>
        <span>
          <IconButton
            onClick={() => dispatch(projectSlice.actions.toggleTimeExpansion())}
            disabled={!containsTimeSeries}
          >
            {timeExpanded ? (
              <ExpandedClockIcon
                color={
                  containsTimeSeries
                    ? theme.palette.text.primary
                    : theme.palette.action.disabled
                }
              />
            ) : (
              <CollapsedClockIcon
                color={
                  containsTimeSeries
                    ? theme.palette.text.primary
                    : theme.palette.action.disabled
                }
              />
            )}
          </IconButton>
        </span>
      </Tooltip>
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
