import React, { useState } from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Transformer } from "konva/types/shapes/Transformer";
import { Ellipse } from "konva/types/shapes/Ellipse";
import { toRGBA } from "../../../image/toRGBA";
import { Category } from "../../../types/Category";

type ImageViewerProps = {
  data: Image;
  category: Category;
};

export const EllipticalSelection = ({ data, category }: ImageViewerProps) => {
  const [image] = useImage(data.src);

  const stageRef = React.useRef<Stage>(null);
  const transformerRef = React.useRef<Transformer>(null);
  const ellipticalSelectionRef = React.useRef<Ellipse>(null);

  const [
    ellipticalSelectionStartX,
    setEllipticalSelectionStartX,
  ] = React.useState<number>(0);
  const [
    ellipticalSelectionStartY,
    setEllipticalSelectionStartY,
  ] = React.useState<number>(0);
  const [
    ellipticalSelectionCenterX,
    setEllipticalSelectionCenterX,
  ] = React.useState<number>();
  const [
    ellipticalSelectionCenterY,
    setEllipticalSelectionCenterY,
  ] = React.useState<number>();
  const [
    ellipticalSelectionRadiusX,
    setEllipticalSelectionRadiusX,
  ] = React.useState<number>(0);
  const [
    ellipticalSelectionRadiusY,
    setEllipticalSelectionRadiusY,
  ] = React.useState<number>(0);

  const [annotated, setAnnotated] = useState<boolean>();
  const [annotating, setAnnotating] = useState<boolean>();

  const [offset, setOffset] = useState<number>(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(offset + 1);
      if (offset > 32) {
        setOffset(0);
      }
    }, 200);

    return () => clearTimeout(timer);
  });

  React.useEffect(() => {
    if (annotated && !annotating) {
      // we need to attach transformer manually
      if (
        transformerRef &&
        transformerRef.current &&
        ellipticalSelectionRef &&
        ellipticalSelectionRef.current
      ) {
        transformerRef.current.nodes([ellipticalSelectionRef.current]);
        const layer = transformerRef.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
    }
  }, [annotated, annotating]);

  const onEllipticalSelectionMouseDown = () => {
    if (annotated) return;

    setAnnotating(true);

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        setEllipticalSelectionStartX(position.x);
        setEllipticalSelectionStartY(position.y);
      }
    }
  };

  const onEllipticalSelectionMouseMove = () => {
    if (annotated) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (ellipticalSelectionStartX && ellipticalSelectionStartY && position) {
        setEllipticalSelectionCenterX(
          (position.x - ellipticalSelectionStartX) / 2 +
            ellipticalSelectionStartX
        );
        setEllipticalSelectionCenterY(
          (position.y - ellipticalSelectionStartY) / 2 +
            ellipticalSelectionStartY
        );
        setEllipticalSelectionRadiusX(
          Math.abs((position.x - ellipticalSelectionStartX) / 2)
        );
        setEllipticalSelectionRadiusY(
          Math.abs((position.y - ellipticalSelectionStartY) / 2)
        );
      }
    }
  };

  const onEllipticalSelectionMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    setAnnotated(true);
    setAnnotating(false);
  };

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={data.shape?.r}
      ref={stageRef}
      width={data.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onEllipticalSelectionMouseDown}
        onMouseMove={onEllipticalSelectionMouseMove}
        onMouseUp={onEllipticalSelectionMouseUp}
      >
        <ReactKonva.Image image={image} />

        {!annotated &&
          annotating &&
          ellipticalSelectionCenterX &&
          ellipticalSelectionCenterY && (
            <React.Fragment>
              <ReactKonva.Ellipse
                radiusX={ellipticalSelectionRadiusX}
                radiusY={ellipticalSelectionRadiusY}
                stroke="black"
                strokeWidth={1}
                x={ellipticalSelectionCenterX}
                y={ellipticalSelectionCenterY}
              />
              <ReactKonva.Ellipse
                dash={[4, 2]}
                dashOffset={-offset}
                radiusX={ellipticalSelectionRadiusX}
                radiusY={ellipticalSelectionRadiusY}
                stroke="white"
                strokeWidth={1}
                x={ellipticalSelectionCenterX}
                y={ellipticalSelectionCenterY}
              />
            </React.Fragment>
          )}

        {annotated &&
          !annotating &&
          ellipticalSelectionCenterX &&
          ellipticalSelectionCenterY && (
            <ReactKonva.Ellipse
              dash={[4, 2]}
              dashOffset={-offset}
              radiusX={ellipticalSelectionRadiusX}
              radiusY={ellipticalSelectionRadiusY}
              ref={ellipticalSelectionRef}
              stroke="white"
              strokeWidth={1}
              x={ellipticalSelectionCenterX}
              y={ellipticalSelectionCenterY}
              fill={toRGBA(category.color, 0.3)}
            />
          )}

        <ReactKonva.Transformer
          anchorFill="#FFF"
          anchorStroke="#000"
          anchorStrokeWidth={1}
          anchorSize={6}
          borderEnabled={false}
          ref={transformerRef}
          rotateEnabled={false}
        />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
