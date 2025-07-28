import React, { ReactElement } from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import { Stack, useTheme } from "@mui/material";
import { Margin } from "@mui/icons-material";

import { Tool } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";

import {
  ColorAnnotation,
  EllipticalAnnotation,
  LassoAnnotation,
  MagneticAnnotation,
  FreehandAnnotation,
  PolygonAnnotation,
  QuickAnnotation,
  RectangleAnnotation,
} from "icons";

import { ToolType } from "views/ImageViewer/utils/enums";
import { ResizableTool } from "components/ui/Tool";
import { SliderOptions } from "utils/types";
import {
  penToolSizeControls,
  QuickToolSizeControls,
  ThresholdToolSizeControls,
} from "views/ImageViewer/utils/consts";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { selectTimeLinkingState } from "views/ImageViewer/state/annotator/selectors";

type ToolMap = Record<
  string,
  {
    operation: ToolType;
    icon: (color: string) => ReactElement;
    options?: SliderOptions;
  }
>;
const toolMap: ToolMap = {
  "Rectangle Tool": {
    operation: ToolType.RectangularAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
  },
  "Ellipse Tool": {
    operation: ToolType.EllipticalAnnotation,
    icon: (color) => <EllipticalAnnotation color={color} />,
  },
  "Polygon Tool": {
    operation: ToolType.PolygonalAnnotation,
    icon: (color) => <PolygonAnnotation color={color} />,
  },
  "Pen Tool": {
    operation: ToolType.PenAnnotation,
    icon: (color) => <FreehandAnnotation color={color} />,
    options: penToolSizeControls,
  },
  "Lasso Tool": {
    operation: ToolType.LassoAnnotation,
    icon: (color) => <LassoAnnotation color={color} />,
  },
  "Magnetic Tool": {
    operation: ToolType.MagneticAnnotation,
    icon: (color) => <MagneticAnnotation color={color} />,
  },
  "Color Tool": {
    operation: ToolType.ColorAnnotation,
    icon: (color) => <ColorAnnotation color={color} />,
  },
  "Quick Annotation Tool": {
    operation: ToolType.QuickAnnotation,
    icon: (color) => <QuickAnnotation color={color} />,
    options: QuickToolSizeControls,
  },
  "Threshold Tool": {
    operation: ToolType.ThresholdAnnotation,
    icon: (color) => <Margin sx={{ color }} />,
    options: ThresholdToolSizeControls,
  },
};

export const ToolOptions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const t = useTranslation();
  const tLinkingActive = useSelector(selectTimeLinkingState);
  const activeTool = useSelector(selectToolType);

  const handleToolClick = (toolName: string) => {
    if (activeTool !== toolMap[toolName].operation)
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: toolMap[toolName].operation,
        }),
      );
  };

  const sliderCallback = (value: number) => {
    switch (activeTool) {
      case ToolType.PenAnnotation:
        dispatch(
          annotatorSlice.actions.setPenSelectionBrushSize({
            penSelectionBrushSize: value,
          }),
        );
        break;
      case ToolType.QuickAnnotation:
        dispatch(
          annotatorSlice.actions.setQuickSelectionRegionSize({
            quickSelectionRegionSize: value,
          }),
        );
        break;
      case ToolType.ThresholdAnnotation:
        dispatch(
          annotatorSlice.actions.setThresholdAnnotationValue({
            thresholdAnnotationValue: value,
          }),
        );
        break;
    }
  };

  return (
    <Stack data-help={HelpItem.ObjectCreationTools}>
      {Object.keys(toolMap).map((name, idx) => {
        const tool = toolMap[name];

        return tool.options ? (
          <ResizableTool
            key={`${name}_${idx}`}
            name={t(name)}
            onClick={() => handleToolClick(name)}
            selected={activeTool === tool.operation}
            callback={sliderCallback}
            toolLimits={tool.options}
            tooltipLocation="left"
            disabled={tLinkingActive}
          >
            {tool.icon(
              activeTool === tool.operation
                ? theme.palette.primary.dark
                : theme.palette.action.active,
            )}
          </ResizableTool>
        ) : (
          <Tool
            key={`${name}_${idx}`}
            name={t(name)}
            onClick={() => handleToolClick(name)}
            tooltipLocation="left"
            disabled={tLinkingActive}
          >
            {tool.icon(
              activeTool === tool.operation
                ? theme.palette.primary.dark
                : theme.palette.action.active,
            )}
          </Tool>
        );
      })}
    </Stack>
  );
};
