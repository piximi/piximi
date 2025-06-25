import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Divider, List, Stack, useTheme } from "@mui/material";
import { Layers as LayersIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { CustomListItem, CustomListItemButton } from "components/ui";
import { IncrementalSlider } from "components/inputs";
import { PopoverTool } from "components/ui/Tool";
import { ChannelsList, ApplyColorsButton } from "views/ImageViewer/components";

import { selectLoadMessage } from "store/applicationSettings/selectors";
import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectActiveImageRenderedSrcs } from "views/ImageViewer/state/imageViewer/selectors";

import { ColorAdjustment } from "icons";
import { generateDefaultColors } from "utils/tensorUtils";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ImageOptions = () => {
  return (
    <Stack data-help={HelpItem.ImageTools} direction="row">
      <ChannelAdjustment />
      <ZStackSlider />
    </Stack>
  );
};

const ChannelAdjustment = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const t = useTranslation();

  const activeImage = useSelector(selectActiveImage);
  const progressMessage = useSelector(selectLoadMessage);

  const handleResetChannelsClick = async () => {
    if (!activeImage) return;

    const defaultColors = await generateDefaultColors(activeImage.data);

    dispatch(
      annotatorSlice.actions.editThings({
        updates: [{ id: activeImage.id!, colors: defaultColors }],
      }),
    );
  };

  return (
    <PopoverTool
      name={t("Channel Adjustment")}
      popoverElement={
        <Box
          sx={{
            bgcolor: "background.paper",
            minWidth: "200px",
            borderRadius: "8px",
          }}
        >
          <ChannelsList />

          <Divider />

          <List dense>
            <CustomListItemButton
              primaryText={t("Reset colors")}
              onClick={handleResetChannelsClick}
            />
            <ApplyColorsButton />
            {progressMessage && (
              <CustomListItem primaryText={progressMessage} />
            )}
          </List>
        </Box>
      }
    >
      <ColorAdjustment color={theme.palette.action.active} />
    </PopoverTool>
  );
};

const ZStackSlider = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const activeImage = useSelector(selectActiveImage);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);

  const zStackLimits = useMemo(() => {
    if (!activeImage) return { min: 0, max: 0, step: 1, initial: 0 };
    return {
      min: 0,
      max: activeImage.shape.planes - 1,
      step: 1,
      initial: activeImage.activePlane,
    };
  }, [activeImage]);
  const zStackCallback = async (newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        annotatorSlice.actions.editThings({
          updates: [
            {
              id: activeImage!.id,
              activePlane: newValue,
              src: renderedSrcs[newValue],
            },
          ],
        }),
      );
    }
  };

  return (
    <PopoverTool
      name={t("Z-Stack")}
      disabled={zStackLimits.max === 0}
      popoverElement={
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: "8px",
          }}
        >
          <IncrementalSlider
            min={zStackLimits.min}
            max={zStackLimits.max}
            step={zStackLimits.step}
            initialValue={zStackLimits.initial}
            callback={zStackCallback}
            orientation="vertical"
            length="100px"
            callbackOnSlide={true}
          />
        </Box>
      }
    >
      <LayersIcon />
    </PopoverTool>
  );
};
