import React from "react";

import { EllipticalSelection } from "./EllipticalSelection";
import { LassoSelection } from "./LassoSelection";
import { MagneticSelection } from "./MagneticSelection";
import { ObjectSelection } from "./ObjectSelection";
import { PolygonalSelection } from "./PolygonalSelection";
import { RectangularSelection } from "./RectangularSelection";
import { ColorSelection } from "./ColorSelection/ColorSelection";
import { QuickSelection } from "./QuickSelection/QuickSelection";
import { PenSelection } from "./PenSelection";
import { ZoomSelection } from "./ZoomSelection";

import { ToolType } from "types";

import {
  ColorAnnotationTool,
  EllipticalAnnotationTool,
  LassoAnnotationTool,
  MagneticAnnotationTool,
  ObjectAnnotationTool,
  PenAnnotationTool,
  PolygonalAnnotationTool,
  QuickAnnotationTool,
  RectangularAnnotationTool,
} from "annotator-tools";
import { Tool } from "annotator-tools/Tool";

type SelectionProps = {
  tool?: Tool;
  toolType?: ToolType;
};

export const Selection = ({ tool, toolType }: SelectionProps) => {
  if (!toolType || !tool) return <></>;

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
