import React, { ReactElement, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Drawer } from "@mui/material";

import { useTranslation } from "hooks";
import { AppBarOffset } from "components/styled-components";

import { PenSelectionIconOptions } from "./PenSelectionIconOptions";
import { QuickAnnotationOptions } from "./QuickAnnotationOptions";
import { ZoomOptions } from "./ZoomOptions";
import { ColorAdjustmentOptions } from "./ColorAdjustmentOptions";
import { PointerSelectionOptions } from "./PointerSelectionOptions";
import { ThresholdAnnotationOptions } from "./ThresholdAnnotationOptions";
import { InformationBox } from "./InformationBox";
import { DefaultOptions } from "./DefaultOptions";

import { selectToolType } from "store/annotator/selectors";

import { ToolType } from "types";

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
    options: <DefaultOptions />,
    hotkey: "R",
  },
  {
    icon: <EllipticalSelectionIcon />,
    method: ToolType.EllipticalAnnotation,
    name: "Ellipse Tool",
    description: "Click and drag to create an elliptical annotation.",
    options: <DefaultOptions />,
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
    options: <DefaultOptions />,
    hotkey: "L",
  },
  {
    icon: <PolygonalSelectionIcon />,
    method: ToolType.PolygonalAnnotation,
    name: "Polygon Tool",
    description: "-",
    options: <DefaultOptions />,
    hotkey: "P",
  },
  {
    icon: <MagneticSelectionIcon />,
    method: ToolType.MagneticAnnotation,
    name: "Magnetic Tool",
    description: "-",
    options: <DefaultOptions />,
    hotkey: "M",
  },
  {
    icon: <ColorSelectionIcon />,
    method: ToolType.ColorAnnotation,
    name: "Color Tool",
    description: "-",
    options: <DefaultOptions />,
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
    options: <DefaultOptions />,
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
export const ToolOptions = ({
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
