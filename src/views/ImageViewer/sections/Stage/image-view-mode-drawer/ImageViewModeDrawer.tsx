import { Box, ButtonGroup, IconButton, Stack, useTheme } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Layers as LayersIcon } from "@mui/icons-material";
import { ColorAdjustment } from "icons";
import { useState } from "react";
import { DIMENSIONS } from "utils/constants";
import { ChannelAdjustment } from "./ChannelAdjustment";
import { ZStackSlider } from "./ZAdjustment";
import { TimepointAdjustment } from "./TimepointAdjustment";

export const ImageViewModeDrawer = () => {
  const theme = useTheme();
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

  return (
    <Box
      sx={(theme) => ({
        maxWidth: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        width: "100%", //`calc(100% - ${DIMENSIONS.toolDrawerWidth}px - ${DIMENSIONS.leftDrawerWidth}px)`,
        height: "150px",
        position: "absolute",
        bottom:
          DIMENSIONS.stageInfoHeight -
          (open ? 0 : 150 - DIMENSIONS.toolDrawerWidth) +
          "px",
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
          <IconButton onClick={() => handleSelectImageViewMode(1)}>
            <AccessTimeIcon
              sx={{
                color:
                  imageViewMode === 1 && open
                    ? theme.palette.primary.dark
                    : theme.palette.action.active,
              }}
            />
          </IconButton>
          <IconButton onClick={() => handleSelectImageViewMode(2)}>
            <LayersIcon
              sx={{
                color:
                  imageViewMode === 2 && open
                    ? theme.palette.primary.dark
                    : theme.palette.action.active,
              }}
            />
          </IconButton>
        </ButtonGroup>
      </Stack>
      {imageViewMode === 0 && (
        <Stack
          direction="row"
          sx={{ flexGrow: 1, maxWidth: "100%", width: "100%" }}
          gap={1}
        >
          <ChannelAdjustment />
        </Stack>
      )}
      {imageViewMode === 1 && ( // For cleaner typescript, shouldnt be able to focus on if values undefined
        <TimepointAdjustment />
      )}
      {imageViewMode === 2 && ( // For cleaner typescript, shouldnt be able to focus on if values undefined
        <ZStackSlider />
      )}
    </Box>
  );
};
