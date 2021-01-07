import React, { useEffect, useState } from "react";
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

  const stage = React.useRef<Stage>(null);

  const transformer = React.useRef<Transformer>(null);
  const shapeRef = React.useRef<Ellipse>(null);

  const [startX, setStartX] = React.useState<number>(0);
  const [startY, setStartY] = React.useState<number>(0);
  const [centerX, setCenterX] = React.useState<number>();
  const [centerY, setCenterY] = React.useState<number>();
  const [radiusX, setRadiusX] = React.useState<number>(0);
  const [radiusY, setRadiusY] = React.useState<number>(0);

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
      if (transformer && transformer.current && shapeRef && shapeRef.current) {
        transformer.current.nodes([shapeRef.current]);
        const layer = transformer.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
    }
  }, [annotated, annotating]);

  const onMouseDown = () => {
    if (annotated) return;

    setAnnotating(true);

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        setStartX(position.x);
        setStartY(position.y);
      }
    }
  };

  const onMouseMove = () => {
    if (annotated) return;

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (startX && startY && position) {
        setCenterX((position.x - startX) / 2 + startX);
        setCenterY((position.y - startY) / 2 + startY);
        setRadiusX(Math.abs((position.x - startX) / 2));
        setRadiusY(Math.abs((position.y - startY) / 2));
      }
    }
  };

  const onMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    setAnnotated(true);
    setAnnotating(false);
  };

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={data.shape?.r}
      ref={stage}
      width={data.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <ReactKonva.Image image={image} />

        {!annotated && annotating && centerX && centerY && (
          <React.Fragment>
            <ReactKonva.Ellipse
              radiusX={radiusX}
              radiusY={radiusY}
              stroke="black"
              strokeWidth={1}
              x={centerX}
              y={centerY}
            />
            <ReactKonva.Ellipse
              dash={[4, 2]}
              dashOffset={-offset}
              radiusX={radiusX}
              radiusY={radiusY}
              stroke="white"
              strokeWidth={1}
              x={centerX}
              y={centerY}
            />
          </React.Fragment>
        )}

        {annotated && !annotating && centerX && centerY && (
          <ReactKonva.Ellipse
            dash={[4, 2]}
            dashOffset={-offset}
            radiusX={radiusX}
            radiusY={radiusY}
            ref={shapeRef}
            stroke="white"
            strokeWidth={1}
            x={centerX}
            y={centerY}
            fill={toRGBA(category.color, 0.3)}
          />
        )}

        <ReactKonva.Transformer
          anchorFill="#FFF"
          anchorStroke="#000"
          anchorStrokeWidth={1}
          anchorSize={6}
          borderEnabled={false}
          ref={transformer}
          rotateEnabled={false}
        />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
