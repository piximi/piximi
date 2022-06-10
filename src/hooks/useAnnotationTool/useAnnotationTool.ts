import { useEffect, useState } from "react";
import * as ImageJS from "image-js";
import { ToolType } from "../../types/ToolType";
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
} from "../../annotator/image/Tool";
import { useSelector } from "react-redux";
import { stageScaleSelector, toolTypeSelector } from "../../store/selectors";
import { penSelectionBrushSizeSelector } from "../../store/selectors/penSelectionBrushSizeSelector";
import { quickSelectionRegionSizeSelector } from "../../store/selectors/quickSelectionRegionSizeSelector";
import { imageSrcSelector } from "../../store/selectors/imageSrcSelector";
import { ThresholdAnnotationTool } from "annotator/image/Tool/AnnotationTool/ThresholdAnnotationTool";
import { thresholdAnnotationValueSelector } from "store/selectors/thresholdAnnotationValueSelector";

export const useAnnotationTool = () => {
  const src = useSelector(imageSrcSelector);
  const operation = useSelector(toolTypeSelector);
  const stageScale = useSelector(stageScaleSelector);

  const [operator, setOperator] = useState<AnnotationTool>();

  const [image, setImage] = useState<ImageJS.Image>();

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);

  const quickSelectionBrushSize = useSelector(quickSelectionRegionSizeSelector);

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
        PenAnnotationTool.setup(
          image,
          penSelectionBrushSize / (stageScale ? stageScale : 1)
        ).then((operator: PenAnnotationTool) => {
          setOperator(operator);
        });

        return;
      case ToolType.PolygonalAnnotation:
        setOperator(new PolygonalAnnotationTool(image));

        return;
      case ToolType.QuickAnnotation:
        const quickSelectionOperator = QuickAnnotationTool.setup(
          image,
          quickSelectionBrushSize / Math.round(stageScale ? stageScale : 1)
        );
        setOperator(quickSelectionOperator);

        return;
      case ToolType.ThresholdAnnotation:
        const thresholdSelectorOperator = ThresholdAnnotationTool.setup(image);
        setOperator(thresholdSelectorOperator);

        return;
      case ToolType.RectangularAnnotation:
        setOperator(new RectangularAnnotationTool(image));

        return;
    }
  }, [
    operation,
    image,
    penSelectionBrushSize,
    stageScale,
    quickSelectionBrushSize,
  ]);

  useEffect(() => {
    if (operator instanceof ThresholdAnnotationTool) {
      operator.updateMask(threshold);
    }
  }, [operation, operator, threshold]);

  return [operator];
};
