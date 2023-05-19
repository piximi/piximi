import { RefObject } from "react";
import Konva from "konva";

export const useTransformer = (stageRef: RefObject<Konva.Stage>) => {
  const detachTransformer = (annotationId: string) => {
    if (!stageRef || !stageRef.current) return;
    const transformerId = "tr-".concat(annotationId);
    const transformer = stageRef.current.findOne(`#${transformerId}`);

    if (!transformer) return;

    (transformer as Konva.Transformer).detach();
    (transformer as Konva.Transformer).getLayer()?.batchDraw();
  };
  const deselectAllTransformers = () => {
    if (!stageRef || !stageRef.current) return;

    // const transformers = stageRef.current.find("Transformer").toArray();
    const transformers = stageRef.current.find("Transformer");
    transformers.forEach((tr: any) => {
      (tr as Konva.Transformer).detach();
      (tr as Konva.Transformer).getLayer()?.batchDraw();
    });
  };

  return { detachTransformer, deselectAllTransformers };
};
