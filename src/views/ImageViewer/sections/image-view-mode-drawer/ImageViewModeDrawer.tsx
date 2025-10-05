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
import { useDispatch, useSelector } from "react-redux";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { HotkeyContext } from "utils/enums";
import { applicationSettingsSlice } from "store/applicationSettings";

const MODE_HOTKEY_CONTEXT = {
  0: HotkeyContext.ColorAdjustment,
  1: HotkeyContext.TimepointAdjustment,
  2: HotkeyContext.ZAdjustment,
};
export const ImageViewModeDrawer = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const activeMetadata = useSelector(selectActiveMetadata);
  const [imageViewMode, setImageViewMode] = useState<0 | 1 | 2>(0);
  const [open, setOpen] = useState<boolean>(false);

  const handleSelectImageViewMode = (view: 0 | 1 | 2) => {
    if (view !== imageViewMode) {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: MODE_HOTKEY_CONTEXT[imageViewMode],
        }),
      );
      dispatch(
        applicationSettingsSlice.actions.registerHotkeyContext({
          context: MODE_HOTKEY_CONTEXT[view],
        }),
      );
      setImageViewMode(view);
      setOpen(true);
    } else {
      if (open)
        dispatch(
          applicationSettingsSlice.actions.unregisterHotkeyContext({
            context: MODE_HOTKEY_CONTEXT[imageViewMode],
          }),
        );
      else
        dispatch(
          applicationSettingsSlice.actions.registerHotkeyContext({
            context: MODE_HOTKEY_CONTEXT[imageViewMode],
          }),
        );
      setOpen(!open);
    }
  };

  return activeMetadata ? (
    <Box
      sx={{
        maxWidth: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        width: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        height: "max-content",
        position: "absolute",
        bottom: DIMENSIONS.stageInfoHeight + 1 + "px", // +1px to expose padding of stage
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        px: "1px", // +1px to show padding of stage
        borderRadius: "4px",
      }}
    >
      <Stack
        direction="row"
        height={DIMENSIONS.toolDrawerWidth + "px"}
        width="100%"
        justifyContent="center"
      >
        <ButtonGroup
          variant="outlined"
          size="small"
          sx={(theme) => ({
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px 4px 0 0",
            borderBottom: "none",
            transform: "translateY(1px)", // cover top border of collapse
          })}
        >
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
      <Collapse
        in={open}
        sx={(theme) => ({
          width: "100%",
          bgcolor: theme.palette.background.paper,
          px: 2,
          pt: open ? 1 : 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: "inherit",
        })}
      >
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
