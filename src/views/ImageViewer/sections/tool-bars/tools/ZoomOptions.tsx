import React, { useContext } from "react";
import {
  FitScreen as FitScreenIcon,
  AspectRatio as AspectRatioIcon,
  ControlCamera as ControlCameraIcon,
  CropFree as CropFreeIcon,
} from "@mui/icons-material";
import { Stack, useTheme } from "@mui/material";
import { Tool } from "components/ui/Tool";
import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";
import {
  selectStageHeight,
  selectStageWidth,
  selectZoomToolOptions,
} from "views/ImageViewer/state/imageViewer/selectors";
import { StageContext } from "views/ImageViewer/state/StageContext";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { useZoom } from "views/ImageViewer/hooks";
import { CursorZoom, StageZoom } from "icons";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";
import { ToolType } from "views/ImageViewer/utils/enums";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ZoomOptions = () => {
  const stageRef = useContext(StageContext);

  const dispatch = useDispatch();
  const activeTool = useSelector(selectToolType);
  const options = useSelector(selectZoomToolOptions);
  const stageWidth = useSelector(selectStageWidth);
  const stageHeight = useSelector(selectStageHeight);
  const image = useSelector(selectActiveImage);
  const theme = useTheme();
  const t = useTranslation();
  const { zoomAndOffset } = useZoom(stageRef?.current);

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
    if (!stageRef?.current) return;
    stageRef?.current?.position({
      x: ((1 - stageRef.current.scaleX()!) * stageWidth) / 2,
      y: ((1 - stageRef.current.scaleX()!) * stageHeight) / 2,
    });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: {
          x: ((1 - stageRef.current.scaleX()!) * stageWidth) / 2,
          y: ((1 - stageRef.current.scaleX()!) * stageHeight) / 2,
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
