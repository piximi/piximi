import React, { ReactElement, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Drawer } from "@mui/material";

import { useTranslation } from "hooks";

import { AppBarOffset } from "components/AppBarOffset";
import { InformationBox } from "./InformationBox";
import {
  BaseOptions,
  ColorAdjustmentOptions,
  PenSelectionIconOptions,
  PointerSelectionOptions,
  QuickAnnotationOptions,
  ThresholdAnnotationOptions,
  ZoomOptions,
} from "./options";

import { selectToolType } from "store/annotator/selectors";

import { ToolType } from "utils/annotator/enums";

import {
  ColorAdjustmentIcon,
  ColorSelectionIcon,
  EllipticalSelectionIcon,
  LassoSelectionIcon,
  MagneticSelectionIcon,
  ObjectSelectionIcon,
  PenSelectionIcon,
  PolygonalSelectionIcon,
  QuickSelectionIcon,
  RectangularSelectionIcon,
  ZoomIcon,
} from "icons";

type OperationType = {
  icon: ReactElement;
  method: ToolType;
  name: string;
  description: string;
  options: ReactElement;
  hotkey: string;
};

const operations: Array<OperationType> = [
  {
    icon: <ColorAdjustmentIcon />,
    method: ToolType.ColorAdjustment,
    name: "Channel Adjustment",
    description: "-",
    options: <ColorAdjustmentOptions />,
    hotkey: "I",
  },
  {
    icon: <RectangularSelectionIcon />,
    method: ToolType.RectangularAnnotation,
    name: "Rectangle Tool",
    description: "Click and drag to create a rectangular annotation.",
    options: <BaseOptions />,
    hotkey: "R",
  },
  {
    icon: <EllipticalSelectionIcon />,
    method: ToolType.EllipticalAnnotation,
    name: "Ellipse Tool",
    description: "Click and drag to create an elliptical annotation.",
    options: <BaseOptions />,
    hotkey: "E",
  },
  {
    icon: <PenSelectionIcon />,
    method: ToolType.PenAnnotation,
    name: "Pen Tool",
    description: "-",
    options: <PenSelectionIconOptions />,
    hotkey: "D",
  },
  {
    icon: <LassoSelectionIcon />,
    method: ToolType.LassoAnnotation,
    name: "Lasso Tool",
    description: "-",
    options: <BaseOptions />,
    hotkey: "L",
  },
  {
    icon: <PolygonalSelectionIcon />,
    method: ToolType.PolygonalAnnotation,
    name: "Polygon Tool",
    description: "-",
    options: <BaseOptions />,
    hotkey: "P",
  },
  {
    icon: <MagneticSelectionIcon />,
    method: ToolType.MagneticAnnotation,
    name: "Magnetic Tool",
    description: "-",
    options: <BaseOptions />,
    hotkey: "M",
  },
  {
    icon: <ColorSelectionIcon />,
    method: ToolType.ColorAnnotation,
    name: "Color Tool",
    description: "-",
    options: <BaseOptions />,
    hotkey: "C",
  },
  {
    icon: <RectangularSelectionIcon />,
    method: ToolType.ThresholdAnnotation,
    name: "Threshold Tool",
    description: "Click and drag to create a rectangular annotation.",
    options: <ThresholdAnnotationOptions />,
    hotkey: "T",
  },
  {
    icon: <QuickSelectionIcon />,
    method: ToolType.QuickAnnotation,
    name: "Quick Annotation Tool",
    description: "-",
    options: <QuickAnnotationOptions />,
    hotkey: "Q",
  },
  {
    icon: <ObjectSelectionIcon />,
    method: ToolType.ObjectAnnotation,
    name: "Object selection",
    description: "-",
    options: <BaseOptions />,
    hotkey: "O",
  },
  {
    icon: <ZoomIcon />,
    method: ToolType.Zoom,
    name: "Zoom Tool",
    description: "-",
    options: <ZoomOptions />,
    hotkey: "Z",
  },
  {
    icon: <ObjectSelectionIcon />,
    method: ToolType.Pointer,
    name: "Selection Tool",
    description: "-",
    options: <PointerSelectionOptions />,
    hotkey: "S",
  },
];
export const ToolOptionsDrawer = ({
  optionsVisibility,
}: {
  optionsVisibility: boolean;
}) => {
  const [toolType, setToolType] = useState<OperationType>(operations[0]);
  const activeOperation = useSelector(selectToolType);
  const t = useTranslation();

  useEffect(() => {
    setToolType(
      operations.filter((type) => type.method === activeOperation)[0]
    );
  }, [activeOperation]);

  return (
    <Drawer
      anchor="right"
      sx={{
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          right: 56,
        },
      }}
      variant="persistent"
      open={optionsVisibility}
    >
      <AppBarOffset />
      <InformationBox
        description={toolType!.description}
        name={t(toolType!.name)}
        hotkey={toolType!.hotkey}
      />
      {toolType!.options}
    </Drawer>
  );
};
