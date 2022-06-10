import Drawer from "@mui/material/Drawer";
import React from "react";
import {
  ColorAdjustmentIcon,
  ColorSelectionIcon,
  EllipticalSelectionIcon,
  HandIcon,
  LassoSelectionIcon,
  MagneticSelectionIcon,
  ObjectSelectionIcon,
  PenSelectionIcon,
  PolygonalSelectionIcon,
  QuickSelectionIcon,
  RectangularSelectionIcon,
  ZoomIcon,
} from "../../../../icons";
import { ToolType } from "../../../../types/ToolType";
import { RectangularAnnotationOptions } from "../RectangularAnnotationOptions";
import { EllipticalAnnotationOptions } from "../EllipticalAnnotationOptions";
import { PenSelectionIconOptions } from "../PenSelectionIconOptions";
import { LassoAnnotationOptions } from "../LassoAnnotationOptions";
import { PolygonalAnnotationOptions } from "../PolygonalAnnotationOptions";
import { MagneticAnnotationOptions } from "../MagneticAnnotationOptions";
import { ColorAnnotationOptions } from "../ColorAnnotationOptions";
import { QuickAnnotationOptions } from "../QuickAnnotationOptions";
import { ObjectAnnotationOptions } from "../ObjectAnnotationOptions";
import { ZoomOptions } from "../ZoomOptions";
import { useSelector } from "react-redux";
import { toolTypeSelector } from "../../../../store/selectors";
import { HandToolOptions } from "../HandToolOptions/HandToolOptions";
import { ColorAdjustmentOptions } from "../ColorAdjustmentOptions/ColorAdjustmentOptions/ColorAdjustmentOptions";
import { PointerSelectionOptions } from "../PointerSelectionOptions";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { ThresholdAnnotationOptions } from "../ThresholdAnnotationOptions";

export const ToolOptions = () => {
  const activeOperation = useSelector(toolTypeSelector);

  // @ts-ignore
  const operations = [
    {
      icon: <ColorAdjustmentIcon />,
      method: ToolType.ColorAdjustment,
      name: "Color adjustment",
      options: <ColorAdjustmentOptions />,
    },
    {
      icon: <RectangularSelectionIcon />,
      method: ToolType.RectangularAnnotation,
      name: "Rectangular selection",
      options: <RectangularAnnotationOptions />,
    },
    {
      icon: <EllipticalSelectionIcon />,
      method: ToolType.EllipticalAnnotation,
      name: "Elliptical selection",
      options: <EllipticalAnnotationOptions />,
    },
    {
      icon: <PenSelectionIcon />,
      method: ToolType.PenAnnotation,
      name: "Pen selection",
      options: <PenSelectionIconOptions />,
    },
    {
      icon: <LassoSelectionIcon />,
      method: ToolType.LassoAnnotation,
      name: "Lasso selection",
      options: <LassoAnnotationOptions />,
    },
    {
      icon: <PolygonalSelectionIcon />,
      method: ToolType.PolygonalAnnotation,
      name: "Polygonal selection",
      options: <PolygonalAnnotationOptions />,
    },
    {
      icon: <MagneticSelectionIcon />,
      method: ToolType.MagneticAnnotation,
      name: "Magnetic selection",
      options: <MagneticAnnotationOptions />,
    },
    {
      icon: <ColorSelectionIcon />,
      method: ToolType.ColorAnnotation,
      name: "Color selection",
      options: <ColorAnnotationOptions />,
    },
    {
      icon: <RectangularSelectionIcon />,
      method: ToolType.ThresholdAnnotation,
      name: "Test selection",
      options: <ThresholdAnnotationOptions />,
    },
    {
      icon: <QuickSelectionIcon />,
      method: ToolType.QuickAnnotation,
      name: "Quick selection",
      options: <QuickAnnotationOptions />,
    },
    {
      icon: <ObjectSelectionIcon />,
      method: ToolType.ObjectAnnotation,
      name: "Object selection",
      options: <ObjectAnnotationOptions />,
    },
    {
      icon: <HandIcon />,
      method: ToolType.Hand,
      name: "Hand",
      options: <HandToolOptions />,
    },
    {
      icon: <ZoomIcon />,
      method: ToolType.Zoom,
      name: "Zoom",
      options: <ZoomOptions />,
    },
    {
      icon: <ObjectSelectionIcon />,
      method: ToolType.Pointer,
      name: "Pointer",
      options: <PointerSelectionOptions />,
    },
  ];

  return (
    <Drawer
      anchor="right"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          right: 56,
        },
      }}
      variant="permanent"
    >
      <AppBarOffset />

      {
        operations[
          operations.findIndex(
            (operation) => operation.method === activeOperation
          )
        ].options
      }
    </Drawer>
  );
};
