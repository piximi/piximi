import {
  Box,
  ButtonGroup,
  Collapse,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Layers as LayersIcon } from "@mui/icons-material";
import { ColorAdjustment } from "icons";
import { useState } from "react";
import { DIMENSIONS } from "utils/constants";
import { ChannelAdjustment } from "./ChannelAdjustment";
import { ZStackSlider } from "./ZAdjustment";
import { TimepointAdjustment } from "./TimepointAdjustment";
import { useSelector } from "react-redux";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";

export const ImageViewModeDrawer = () => {
  const theme = useTheme();
  const activeMetadata = useSelector(selectActiveMetadata);
  const [imageViewMode, setImageViewMode] = useState<0 | 1 | 2>(0);
  const [open, setOpen] = useState<boolean>(false);

  const handleSelectImageViewMode = (view: 0 | 1 | 2) => {
    if (view !== imageViewMode) {
      setImageViewMode(view);
      setOpen(true);
    } else {
      setOpen(!open);
    }
  };

  return activeMetadata ? (
    <Box
      sx={(theme) => ({
        maxWidth: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        width: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        height: "max-content",
        position: "absolute",
        bottom: DIMENSIONS.stageInfoHeight + "px",
        bgcolor: theme.palette.background.paper,
        borderBlock: `1px solid ${theme.palette.divider}`,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        px: 2,
      })}
    >
      <Stack
        direction="row"
        gap={1}
        height={DIMENSIONS.toolDrawerWidth + "px"}
        width="100%"
        justifyContent="center"
      >
        <ButtonGroup variant="outlined" size="small">
          <IconButton onClick={() => handleSelectImageViewMode(0)}>
            <ColorAdjustment
              color={
                imageViewMode === 0 && open
                  ? theme.palette.primary.dark
                  : theme.palette.action.active
              }
            />
          </IconButton>
          <IconButton
            onClick={() => handleSelectImageViewMode(1)}
            disabled={
              !activeMetadata || Object.keys(activeMetadata.images).length === 1
            }
          >
            <AccessTimeIcon
              sx={{
                color:
                  !activeMetadata ||
                  Object.keys(activeMetadata.images).length === 1
                    ? theme.palette.action.disabled
                    : imageViewMode === 1 && open
                      ? theme.palette.primary.dark
                      : theme.palette.action.active,
              }}
            />
          </IconButton>
          <IconButton
            onClick={() => handleSelectImageViewMode(2)}
            disabled={!activeMetadata || activeMetadata.activeSrcs.length === 1}
          >
            <LayersIcon
              sx={{
                color:
                  !activeMetadata || activeMetadata.activeSrcs.length === 1
                    ? theme.palette.action.disabled
                    : imageViewMode === 2 && open
                      ? theme.palette.primary.main
                      : theme.palette.action.active,
              }}
            />
          </IconButton>
        </ButtonGroup>
      </Stack>
      <Collapse in={open}>
        {imageViewMode === 0 && (
          <Stack
            direction="row"
            sx={{ flexGrow: 1, maxWidth: "100%", width: "100%" }}
            gap={1}
          >
            <ChannelAdjustment />
          </Stack>
        )}
        {imageViewMode === 1 &&
          activeMetadata.timeSeries && ( // For cleaner typescript, shouldnt be able to focus on if values undefined
            <TimepointAdjustment />
          )}
        {imageViewMode === 2 &&
          activeMetadata.activeSrcs.length > 0 && ( // For cleaner typescript, shouldnt be able to focus on if values undefined
            <ZStackSlider />
          )}
      </Collapse>
    </Box>
  ) : null;
};
