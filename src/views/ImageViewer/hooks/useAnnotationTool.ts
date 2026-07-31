import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import {
  selectPenSelectionBrushSize,
  selectQuickSelectionRegionSize,
  selectToolType,
  selectThresholdAnnotationValue,
} from "views/ImageViewer/state/annotator/selectors";
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
} from "views/ImageViewer/utils/tools";
import { ToolType } from "views/ImageViewer/utils/enums";

import type { Image as IJSImage } from "image-js-latest";
import type { AnnotationTool } from "views/ImageViewer/utils/tools";

export const useAnnotationTool = (ijsImage: IJSImage | null) => {
  const [operator, setOperator] = useState<AnnotationTool>(
    new BlankAnnotationTool(),
  );

  const operation = useSelector(selectToolType);

  const penSelectionBrushSize = useSelector(selectPenSelectionBrushSize);
  const quickSelectionRegionSize = useSelector(selectQuickSelectionRegionSize);
  const threshold = useSelector(selectThresholdAnnotationValue);

  useEffect(() => {
    if (!ijsImage) return;

    switch (operation) {
      case ToolType.ColorAnnotation:
        setOperator(new ColorAnnotationTool(ijsImage));

        return;
      case ToolType.EllipticalAnnotation:
        setOperator(new EllipticalAnnotationTool(ijsImage));

        return;
      case ToolType.LassoAnnotation:
        setOperator(new LassoAnnotationTool(ijsImage));

        return;
      case ToolType.MagneticAnnotation:
        setOperator(new MagneticAnnotationTool(ijsImage, 0.5));

        return;
      case ToolType.ObjectAnnotation:
        ObjectAnnotationTool.compile(ijsImage).then(
          (operator: ObjectAnnotationTool) => {
            setOperator(operator);
          },
        );

        return;
      case ToolType.PenAnnotation:
        setOperator(new PenAnnotationTool(ijsImage));

        return;
      case ToolType.PolygonalAnnotation:
        setOperator(new PolygonalAnnotationTool(ijsImage));

        return;
      case ToolType.QuickAnnotation:
        setOperator(new QuickAnnotationTool(ijsImage));

        return;
      case ToolType.ThresholdAnnotation:
        setOperator(new ThresholdAnnotationTool(ijsImage));

        return;
      case ToolType.RectangularAnnotation:
        setOperator(new RectangularAnnotationTool(ijsImage));

        return;
      case ToolType.Pointer:
        setOperator(new SelectionTool(ijsImage));

        return;
      default:
        setOperator(new BlankAnnotationTool(ijsImage));

        return;
    }
  }, [operation, ijsImage]);

  useEffect(() => {
    if (operator instanceof ThresholdAnnotationTool) {
      operator.updateMask(threshold);
    }
  }, [operator, threshold]);

  useEffect(() => {
    if (operator instanceof QuickAnnotationTool) {
      const regionSize = quickSelectionRegionSize;
      operator.initializeSuperpixels(regionSize);
    } else if (operator instanceof PenAnnotationTool) {
      const brushSize = penSelectionBrushSize;
      operator.brushSize = Math.round(brushSize);
    }
  }, [operator, quickSelectionRegionSize, penSelectionBrushSize]);

  return {
    annotationTool: operator,
    ToolSelecton: {
      /*!(
                annotationState !== AnnotationStateType.Annotating &&
                toolType !== ToolType.QuickAnnotation
              ) && <Selection tool={annotationTool} toolType={toolType} />}
              <PenAnnotationToolTip
                currentPosition={positionByStage}
                absolutePosition={absolutePosition}
                annotating={annotationState === AnnotationStateType.Annotating}
                outOfBounds={outOfBounds}
              />
              {/* <PointerSelection /> })
            */
    },
  };
};
