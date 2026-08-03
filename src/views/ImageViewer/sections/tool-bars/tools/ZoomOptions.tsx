import { useDispatch, useSelector } from "react-redux";

import {
  FitScreen as FitScreenIcon,
  AspectRatio as AspectRatioIcon,
  ControlCamera as ControlCameraIcon,
} from "@mui/icons-material";
import { Stack, useTheme } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "components/ui/Tool";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { selectZoomToolOptions } from "views/ImageViewer/state/imageViewer/selectors";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { useThreeViewport } from "@ImageViewer/sections/ThreeStage/ThreeViewportContext";
import { CursorZoom, StageZoom } from "icons";

export const ZoomOptions = () => {
  const dispatch = useDispatch();
  const options = useSelector(selectZoomToolOptions);
  const { fitToScreen, zoomToActualSize, resetPosition } = useThreeViewport();
  const theme = useTheme();
  const t = useTranslation();

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
      <Tool name={t("Actual Size")} onClick={zoomToActualSize}>
        <AspectRatioIcon />
      </Tool>
      <Tool name={t("Fit Screen")} onClick={fitToScreen}>
        <FitScreenIcon />
      </Tool>
      <Tool name={t("ResetPosition")} onClick={resetPosition}>
        <ControlCameraIcon />
      </Tool>
    </Stack>
  );
};
