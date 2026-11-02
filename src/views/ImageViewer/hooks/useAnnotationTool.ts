import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

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
  ThresholdAnnotationTool,
  SelectionTool,
  BlankAnnotationTool,
  MeasureTool,
} from "@ImageViewer/core/annotation-tools";
import {
  selectPenSelectionBrushSize,
  selectQuickSelectionRegionSize,
  selectToolType,
  selectThresholdAnnotationValue,
  selectInvertThresholdAnnotation,
} from "@ImageViewer/state/annotator/selectors";
import { ToolType } from "@ImageViewer/utils/enums";

import type { Image as IJSImage } from "image-js-latest";

export const useAnnotationTool = (ijsImage: IJSImage | null) => {
  const operation = useSelector(selectToolType);

  const penSelectionBrushSize = useSelector(selectPenSelectionBrushSize);
  const quickSelectionRegionSize = useSelector(selectQuickSelectionRegionSize);
  const threshold = useSelector(selectThresholdAnnotationValue);
  const invertThreshold = useSelector(selectInvertThresholdAnnotation);

  const syncTool = useMemo(() => {
    if (!ijsImage) {
      return new BlankAnnotationTool();
    }

    switch (operation) {
      case ToolType.ColorAnnotation:
        return new ColorAnnotationTool(ijsImage);

      case ToolType.EllipticalAnnotation:
        return new EllipticalAnnotationTool(ijsImage);

      case ToolType.LassoAnnotation:
        return new LassoAnnotationTool(ijsImage);

      case ToolType.MagneticAnnotation:
        return new MagneticAnnotationTool(ijsImage, 0.5);

      case ToolType.ObjectAnnotation:
        return null;

      case ToolType.PenAnnotation:
        return new PenAnnotationTool(ijsImage);

      case ToolType.PolygonalAnnotation:
        return new PolygonalAnnotationTool(ijsImage);

      case ToolType.QuickAnnotation:
        return new QuickAnnotationTool(ijsImage);

      case ToolType.ThresholdAnnotation:
        return new ThresholdAnnotationTool(ijsImage);

      case ToolType.RectangularAnnotation:
        return new RectangularAnnotationTool(ijsImage);

      case ToolType.Pointer:
        return new SelectionTool(ijsImage);

      case ToolType.Measure:
        return new MeasureTool(ijsImage);

      default:
        return new BlankAnnotationTool(ijsImage);
    }
  }, [ijsImage, operation]);

  const [objectTool, setObjectTool] = useState<{
    image: IJSImage;
    tool: ObjectAnnotationTool;
  } | null>(null);
  useEffect(() => {
    if (operation !== ToolType.ObjectAnnotation || !ijsImage) return;
    let cancelled = false;
    ObjectAnnotationTool.compile(ijsImage).then((tool) => {
      if (!cancelled) setObjectTool({ image: ijsImage, tool });
    });
    return () => {
      cancelled = true;
    };
  }, [operation, ijsImage]);
  const placeHolder = useMemo(() => new BlankAnnotationTool(), []);
  const operator =
    syncTool ??
    (objectTool?.image === ijsImage ? objectTool.tool : placeHolder);

  useEffect(() => {
    if (operator instanceof ThresholdAnnotationTool) {
      operator.updateMask(threshold, invertThreshold);
    }
  }, [operator, threshold, invertThreshold]);

  useEffect(() => {
    if (operator instanceof QuickAnnotationTool) {
      const regionSize = quickSelectionRegionSize;
      operator.initializeSuperpixels(regionSize);
    } else if (operator instanceof PenAnnotationTool) {
      const brushSize = penSelectionBrushSize;
      operator.setBrushSize(Math.round(brushSize));
    }
  }, [operator, quickSelectionRegionSize, penSelectionBrushSize]);

  return operator;
};
