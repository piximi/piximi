import React from "react";

import {
  EllipticalSelection,
  LassoSelection,
  MagneticSelection,
  ObjectSelection,
  PenSelection,
  PolygonalSelection,
  RectangularSelection,
  ZoomSelection,
  ColorSelection,
  QuickSelection,
} from "./selection-options";

import {
  Tool,
  ColorAnnotationTool,
  EllipticalAnnotationTool,
  LassoAnnotationTool,
  MagneticAnnotationTool,
  ObjectAnnotationTool,
  PenAnnotationTool,
  PolygonalAnnotationTool,
  QuickAnnotationTool,
  RectangularAnnotationTool,
  SelectionTool,
} from "views/ImageViewer/utils/tools";
import { ToolType } from "views/ImageViewer/utils/enums";

type SelectionProps = {
  tool: Tool;
  toolType: ToolType;
};

export const Selection = ({ tool, toolType }: SelectionProps) => {
  switch (toolType) {
    case ToolType.ColorAnnotation:
      return <ColorSelection operator={tool as ColorAnnotationTool} />;
    case ToolType.EllipticalAnnotation:
      return (
        <EllipticalSelection operator={tool as EllipticalAnnotationTool} />
      );
    case ToolType.LassoAnnotation:
      return <LassoSelection operator={tool as LassoAnnotationTool} />;
    case ToolType.MagneticAnnotation:
      return <MagneticSelection operator={tool as MagneticAnnotationTool} />;
    case ToolType.ObjectAnnotation:
      return <ObjectSelection operator={tool as ObjectAnnotationTool} />;
    case ToolType.PenAnnotation:
      return <PenSelection operator={tool as PenAnnotationTool} />;
    case ToolType.PolygonalAnnotation:
      return <PolygonalSelection operator={tool as PolygonalAnnotationTool} />;
    case ToolType.RectangularAnnotation:
      return (
        <RectangularSelection operator={tool as RectangularAnnotationTool} />
      );
    case ToolType.Pointer:
      return <RectangularSelection operator={tool as SelectionTool} />;
    case ToolType.ThresholdAnnotation:
      return (
        <RectangularSelection operator={tool as RectangularAnnotationTool} />
      );
    case ToolType.Zoom:
      return <ZoomSelection />;
    case ToolType.QuickAnnotation:
      return <QuickSelection operator={tool as QuickAnnotationTool} />;
    default:
      return <></>;
  }
};
