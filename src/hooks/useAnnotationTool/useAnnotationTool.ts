import { useEffect, useState } from "react";
import * as ImageJS from "image-js";
import { useSelector } from "react-redux";

import {
  imageSrcSelector,
  penSelectionBrushSizeSelector,
  quickSelectionRegionSizeSelector,
  stageScaleSelector,
  thresholdAnnotationValueSelector,
  toolTypeSelector,
} from "store/image-viewer";

import { ToolType } from "types";
import {
  AnnotationTool,
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
} from "annotator/AnnotationTools";

export const useAnnotationTool = () => {
  const src = useSelector(imageSrcSelector);
  const operation = useSelector(toolTypeSelector);
  const stageScale = useSelector(stageScaleSelector);

  const [operator, setOperator] = useState<AnnotationTool>();

  const [image, setImage] = useState<ImageJS.Image>();

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);

  const quickSelectionRegionSize = useSelector(
    quickSelectionRegionSizeSelector
  );

  const threshold = useSelector(thresholdAnnotationValueSelector);

  useEffect(() => {
    if (!src) return;

    const loadImage = async () => {
      const image = await ImageJS.Image.load(src, { ignorePalette: true });
      setImage(image);
    };

    loadImage();
  }, [src]);

  useEffect(() => {
    if (!image) return;

    switch (operation) {
      case ToolType.ColorAnnotation:
        setOperator(new ColorAnnotationTool(image));

        return;
      case ToolType.EllipticalAnnotation:
        setOperator(new EllipticalAnnotationTool(image));

        return;
      case ToolType.LassoAnnotation:
        setOperator(new LassoAnnotationTool(image));

        return;
      case ToolType.MagneticAnnotation:
        setOperator(new MagneticAnnotationTool(image, 0.5));

        return;
      case ToolType.ObjectAnnotation:
        ObjectAnnotationTool.compile(image).then(
          (operator: ObjectAnnotationTool) => {
            setOperator(operator);
          }
        );

        return;
      case ToolType.PenAnnotation:
        setOperator(new PenAnnotationTool(image));

        return;
      case ToolType.PolygonalAnnotation:
        setOperator(new PolygonalAnnotationTool(image));

        return;
      case ToolType.QuickAnnotation:
        setOperator(new QuickAnnotationTool(image));

        return;
      case ToolType.ThresholdAnnotation:
        setOperator(new ThresholdAnnotationTool(image));

        return;
      case ToolType.RectangularAnnotation:
        setOperator(new RectangularAnnotationTool(image));

        return;
    }
  }, [operation, image]);

  useEffect(() => {
    if (operator instanceof ThresholdAnnotationTool) {
      operator.updateMask(threshold);
    }
  }, [operator, threshold]);

  useEffect(() => {
    if (operator instanceof QuickAnnotationTool) {
      const regionSize =
        quickSelectionRegionSize / Math.round(stageScale ? stageScale : 1);
      operator.initializeSuperpixels(regionSize);
    } else if (operator instanceof PenAnnotationTool) {
      const brushSize = penSelectionBrushSize / (stageScale ? stageScale : 1);
      operator.brushSize = Math.round(brushSize);
    }
  }, [operator, quickSelectionRegionSize, penSelectionBrushSize, stageScale]);

  return [operator!];
};
