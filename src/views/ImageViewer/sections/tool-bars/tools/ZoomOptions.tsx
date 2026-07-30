import { useDispatch, useSelector } from "react-redux";

import {
  FitScreen as FitScreenIcon,
  AspectRatio as AspectRatioIcon,
  ControlCamera as ControlCameraIcon,
  CropFree as CropFreeIcon,
} from "@mui/icons-material";
import { Stack, useTheme } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "components/ui/Tool";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import {
  selectStageHeight,
  selectStageWidth,
  selectZoomToolOptions,
} from "views/ImageViewer/state/imageViewer/selectors";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { useZoom } from "views/ImageViewer/hooks";
import { CursorZoom, StageZoom } from "icons";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";
import { ToolType } from "views/ImageViewer/utils/enums";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";

import type { Point } from "utils/types";

const zoomAndOffset = (newScale: number, center: Point) => {};
export const ZoomOptions = () => {
  const dispatch = useDispatch();
  const activeTool = useSelector(selectToolType);
  const options = useSelector(selectZoomToolOptions);
  const stageWidth = useSelector(selectStageWidth);
  const stageHeight = useSelector(selectStageHeight);
  const image = useSelector(selectActiveViewerImage);
  const theme = useTheme();
  const t = useTranslation();

  const handleFitToScreen = () => {
    const payload = {
      options: {
        ...options,
        toFit: !options.toFit,
      },
    };

    if (!image || !image.shape) return;

    const imageWidth = image.shape.width;
    const imageHeight = image.shape.height;
    const newScale = Math.min(
      stageHeight / imageHeight,
      stageWidth / imageWidth,
    );

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
    zoomAndOffset(newScale, { x: stageWidth / 2, y: stageHeight / 2 });
  };
  const handleSetRegionTool = () => {
    if (activeTool !== ToolType.Zoom)
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.Zoom,
        }),
      );
  };

  const handleResetSize = () => {
    const payload = {
      options: {
        ...options,
        toActualSize: !options.toActualSize,
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
    zoomAndOffset(1, { x: stageWidth / 2, y: stageHeight / 2 });
  };
  const handleResetPosition = () => {
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: {
          x: stageWidth / 2,
          y: stageHeight / 2,
        },
      }),
    );
  };
  const handleSetCenteringOption = () => {
    const payload = {
      options: {
        ...options,
        automaticCentering: !options.automaticCentering,
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
  };
  return (
    <Stack data-help={HelpItem.ZoomAndPosition} direction="row">
      <Tool
        name={t(
          `Toggle Zoom Center: ${
            options.automaticCentering ? "Image" : "Cursor"
          }`,
        )}
        onClick={handleSetCenteringOption}
      >
        {options.automaticCentering ? (
          <StageZoom color={theme.palette.action.active} />
        ) : (
          <CursorZoom color={theme.palette.action.active} />
        )}
      </Tool>
      <Tool
        name={t("Zoom To Region")}
        onClick={handleSetRegionTool}
        selected={activeTool === ToolType.Zoom}
      >
        <CropFreeIcon
          sx={{
            color:
              activeTool === ToolType.Zoom
                ? theme.palette.primary.dark
                : theme.palette.action.active,
          }}
        />
      </Tool>
      <Tool name={t("Actual Size")} onClick={handleResetSize}>
        <AspectRatioIcon />
      </Tool>
      <Tool name={t("Fit Screen")} onClick={handleFitToScreen}>
        <FitScreenIcon />
      </Tool>
      <Tool name={t("ResetPosition")} onClick={handleResetPosition}>
        <ControlCameraIcon />
      </Tool>
    </Stack>
  );
};
