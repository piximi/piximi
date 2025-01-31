import React, { useMemo } from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import { Layers as LayersIcon } from "@mui/icons-material";

import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";
import { Box, Divider, List, useTheme } from "@mui/material";
import { PopoverTool } from "views/ImageViewer/components/Tool";
import { ChannelsList } from "../AnnotatorToolDrawer/ToolOptions/ColorAdjustmentOptions/ChannelsList";
import { CustomListItem, CustomListItemButton } from "components/ui";
import { ApplyColorsButton } from "../AnnotatorToolDrawer/ToolOptions/ColorAdjustmentOptions/ApplyColorsButton";
import { selectLoadMessage } from "store/applicationSettings/selectors";
import { generateDefaultColors } from "utils/common/tensorHelpers";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectActiveImageRenderedSrcs } from "views/ImageViewer/state/imageViewer/selectors";
import { IncrementalSlider } from "components/inputs";
import { ColorAdjustment } from "icons";

export const ImageOptions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const t = useTranslation();

  const activeImage = useSelector(selectActiveImage);
  const progressMessage = useSelector(selectLoadMessage);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);

  const handleResetChannelsClick = async () => {
    if (!activeImage) return;

    const defaultColors = await generateDefaultColors(activeImage.data);

    dispatch(
      annotatorSlice.actions.editThings({
        updates: [{ id: activeImage.id!, colors: defaultColors }],
      }),
    );
  };

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
    <Box>
      <PopoverTool
        name={t("Channel Adjustment")}
        tooltipLocation="left"
        popoverElement={
          <Box sx={{ bgcolor: "background.paper", minWidth: "200px" }}>
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
        <ColorAdjustment color={theme.palette.grey[400]} />
      </PopoverTool>
      <PopoverTool
        name={t("Z-Stack")}
        tooltipLocation="left"
        popoverElement={
          <Box
            sx={{
              bgcolor: "background.paper",
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
    </Box>
  );
};
