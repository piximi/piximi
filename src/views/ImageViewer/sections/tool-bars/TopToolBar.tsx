import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  FitScreen as FitScreenIcon,
  AspectRatio as AspectRatioIcon,
  ControlCamera as ControlCameraIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { ImageViewerLogo } from "@ImageViewer/components";
import { selectZoomToolOptions } from "views/ImageViewer/state/imageViewer/selectors";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { useThreeViewport } from "@ImageViewer/sections/ThreeStage/ThreeViewportContext";
import { CursorZoom, StageZoom } from "icons";

import { DIMENSIONS } from "utils/constants";

import { AnnotationTool } from "./AnnotationTool";

const ZoomTools = () => {
  const dispatch = useDispatch();
  const options = useSelector(selectZoomToolOptions);
  const { fitToScreen, zoomToActualSize, resetPosition } = useThreeViewport();
  const theme = useTheme();
  const t = useTranslation();

  const handleSetCenteringOption = (
    _e: React.MouseEvent<HTMLElement, MouseEvent>,
    value: "stage" | "cursor",
  ) => {
    if (
      (value === "stage" && options.automaticCentering) ||
      (value === "cursor" && !options.automaticCentering)
    )
      return;
    const payload = {
      options: {
        ...options,
        automaticCentering: value === "stage",
      },
    };

    dispatch(imageViewerSlice.actions.setZoomToolOptions(payload));
  };

  return (
    <Stack data-help={HelpItem.ZoomAndPosition} direction="row">
      <Tooltip
        title={t(
          `Toggle Zoom Center: ${
            options.automaticCentering ? "Image" : "Cursor"
          }`,
        )}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          onChange={handleSetCenteringOption}
          sx={{ my: "4px", mr: 1 }}
        >
          <ToggleButton
            value="stage"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: "4px",
              px: "7px",
            }}
          >
            <StageZoom
              width="20px"
              height="20px"
              color={
                options.automaticCentering
                  ? theme.palette.primary.main
                  : theme.palette.action.active
              }
            />
          </ToggleButton>
          <ToggleButton
            value="cursor"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: "4px",
              px: "7px",
            }}
          >
            <CursorZoom
              width="20px"
              height="20px"
              color={
                options.automaticCentering
                  ? theme.palette.action.active
                  : theme.palette.primary.main
              }
            />
          </ToggleButton>
        </ToggleButtonGroup>
      </Tooltip>
      <Divider orientation="vertical" flexItem />
      <AnnotationTool
        name={t("Actual Size")}
        onClick={zoomToActualSize}
        icon={<AspectRatioIcon />}
      />
      <AnnotationTool
        name={t("Fit Screen")}
        onClick={fitToScreen}
        icon={<FitScreenIcon />}
      />

      <AnnotationTool
        name={t("ResetPosition")}
        onClick={resetPosition}
        icon={<ControlCameraIcon />}
      />
    </Stack>
  );
};

export const TopToolBar = () => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-tools",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
      })}
    >
      <ImageViewerLogo />
      <Box
        sx={(theme) => ({
          backgroundColor: theme.palette.background.paper,
          position: "relative",
          display: "flex",
          flexGrow: 1,
          justifyContent: "center",
          height: DIMENSIONS.toolDrawerWidth,
          overflowY: "visible",
          zIndex: 1002,
        })}
      >
        <ZoomTools />
      </Box>
    </Stack>
  );
};
