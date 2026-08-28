import type { ReactElement } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Divider, Stack, Typography, useTheme } from "@mui/material";
import { Margin } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { IncrementalSlider } from "components/inputs";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectInvertThresholdAnnotation,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";
import {
  ColorAnnotation,
  EllipticalAnnotation,
  LassoAnnotation,
  MagneticAnnotation,
  FreehandAnnotation,
  PolygonAnnotation,
  QuickAnnotation,
  RectangleAnnotation,
  Selection,
} from "icons";
import { ToolType } from "views/ImageViewer/utils/enums";
import { useAnnotatorToolShortcuts } from "@ImageViewer/hooks";

import { DIMENSIONS } from "utils/constants";

import { AnnotationTool, PopoverAnnotationTool } from "./AnnotationTool";

type SliderOptions = {
  min: number;
  max: number;
  step: number;
  initial: number;
};

type ToolOptions = {
  operation: ToolType;
  icon: (color: string) => ReactElement;
  hotKey?: string;
  options?: SliderOptions;
};
type ToolMap = Record<string, ToolOptions>;

const DEFAULT_PEN_TOOL_OPTIONS: SliderOptions = {
  min: 1,
  max: 25,
  step: 1,
  initial: 10,
};

const DEFAULT_QUICK_TOOL_OPTIONS: SliderOptions = {
  min: 2,
  max: 100,
  step: 1,
  initial: 40,
};

const DEFAULT_THRESHOLD_TOOL_OPTIONS: SliderOptions = {
  min: 1,
  max: 255,
  step: 1,
  initial: 150,
};

const toolMap: ToolMap = {
  "Selection Tool": {
    operation: ToolType.Pointer,
    icon: (color) => <Selection color={color} />,
    hotKey: "S",
  },
  "Rectangle Tool": {
    operation: ToolType.RectangularAnnotation,
    icon: (color) => <RectangleAnnotation color={color} />,
    hotKey: "R",
  },
  "Ellipse Tool": {
    operation: ToolType.EllipticalAnnotation,
    icon: (color) => <EllipticalAnnotation color={color} />,
    hotKey: "E",
  },
  "Polygon Tool": {
    operation: ToolType.PolygonalAnnotation,
    icon: (color) => <PolygonAnnotation color={color} />,
    hotKey: "P",
  },
  "Pen Tool": {
    operation: ToolType.PenAnnotation,
    icon: (color) => <FreehandAnnotation color={color} />,
    options: DEFAULT_PEN_TOOL_OPTIONS,
    hotKey: "F",
  },
  "Lasso Tool": {
    operation: ToolType.LassoAnnotation,
    icon: (color) => <LassoAnnotation color={color} />,
    hotKey: "L",
  },
  "Magnetic Tool": {
    operation: ToolType.MagneticAnnotation,
    icon: (color) => <MagneticAnnotation color={color} />,
    hotKey: "M",
  },
  "Color Tool": {
    operation: ToolType.ColorAnnotation,
    icon: (color) => <ColorAnnotation color={color} />,
    hotKey: "C",
  },
  "Quick Annotation Tool": {
    operation: ToolType.QuickAnnotation,
    icon: (color) => <QuickAnnotation color={color} />,
    options: DEFAULT_QUICK_TOOL_OPTIONS,
    hotKey: "Q",
  },
  "Threshold Tool": {
    operation: ToolType.ThresholdAnnotation,
    icon: (color) => <Margin sx={{ color }} />,
    options: DEFAULT_THRESHOLD_TOOL_OPTIONS,
    hotKey: "T",
  },
};

const AnnotationToolBar = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const t = useTranslation();

  const activeTool = useSelector(selectToolType);
  useAnnotatorToolShortcuts();

  const handleToolClick = (toolName: string) => {
    if (activeTool !== toolMap[toolName].operation)
      dispatch(annotatorSlice.actions.setToolType(toolMap[toolName].operation));
  };

  return (
    <Stack
      data-help={HelpItem.ObjectCreationTools}
      sx={{ height: "100%", bgcolor: "background.paper" }}
    >
      {Object.keys(toolMap).map((name, idx) => {
        const tool = toolMap[name];

        return tool.options ? (
          <PopoverAnnotationTool
            key={`${name}_${idx}`}
            name={t(name)}
            onClick={() => handleToolClick(name)}
            selected={activeTool === tool.operation}
            tooltipLocation="left"
            icon={tool.icon(
              activeTool === tool.operation
                ? theme.palette.primary.dark
                : theme.palette.action.active,
            )}
            PopoverComponent={
              tool.operation === ToolType.ThresholdAnnotation ? (
                <ThresholdOptions toolOptions={tool.options!} />
              ) : (
                <ResizableToolOptions
                  toolOptions={tool.options!}
                  toolType={tool.operation}
                />
              )
            }
            onClickOpen={true}
          />
        ) : (
          <AnnotationTool
            key={`${name}_${idx}`}
            name={t(name)}
            onClick={() => handleToolClick(name)}
            tooltipLocation="left"
            icon={tool.icon(
              activeTool === tool.operation
                ? theme.palette.primary.dark
                : theme.palette.action.active,
            )}
          />
        );
      })}
    </Stack>
  );
};

const ThresholdOptions = ({ toolOptions }: { toolOptions: SliderOptions }) => {
  const dispatch = useDispatch();
  const invert = useSelector(selectInvertThresholdAnnotation);

  const sliderCallback = (value: number) => {
    dispatch(annotatorSlice.actions.setThresholdAnnotationValue(value));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 1,
        pt: 0.5,
      }}
    >
      <IncrementalSlider
        min={toolOptions.min}
        max={toolOptions.max}
        step={toolOptions.step}
        initialValue={toolOptions.initial}
        callback={sliderCallback}
        orientation="horizontal"
        length="100px"
      />
      <Divider sx={{ mt: 1 }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ mr: 1, fontWeight: "bold" }}>
          Background:{" "}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: !invert
              ? "var(--mui-palette-primary-main)"
              : "rgb(var(--mui-palette-primary-mainChannel) / 0.5)",
            mr: 0.5,
            "&:hover": {
              cursor: "pointer",
            },
            fontWeight: !invert ? "bold" : "normal",
          }}
          onClick={() =>
            dispatch(annotatorSlice.actions.setInvertThresholdAnnotation(false))
          }
        >
          Dark
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: invert
              ? "var(--mui-palette-primary-main)"
              : "rgb(var(--mui-palette-primary-mainChannel) / 0.5)",
            "&:hover": {
              cursor: "pointer",
            },
            fontWeight: invert ? "bold" : "normal",
          }}
          onClick={() =>
            dispatch(annotatorSlice.actions.setInvertThresholdAnnotation(true))
          }
        >
          Light
        </Typography>
      </Box>
    </Box>
  );
};

const ResizableToolOptions = ({
  toolOptions,
  toolType,
}: {
  toolOptions: SliderOptions;
  toolType: ToolType;
}) => {
  const dispatch = useDispatch();

  const sliderCallback = (value: number) => {
    switch (toolType) {
      case ToolType.QuickAnnotation:
        dispatch(annotatorSlice.actions.setQuickSelectionRegionSize(value));
        break;
      case ToolType.PenAnnotation:
        dispatch(annotatorSlice.actions.setPenSelectionBrushSize(value));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 1,
        pt: 0.5,
      }}
    >
      <IncrementalSlider
        min={toolOptions.min}
        max={toolOptions.max}
        step={toolOptions.step}
        initialValue={toolOptions.initial}
        callback={sliderCallback}
        orientation={"vertical"}
        length="100px"
      />
    </Box>
  );
};

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-tools",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1,
      }}
    >
      <AnnotationToolBar />
    </Box>
  );
};
