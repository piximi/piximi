import React, { useEffect, useState } from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";

type ImageViewerProps = {
  data: Image;
};

export const EllipticalSelection = ({ data }: ImageViewerProps) => {
  const [image] = useImage(data.src);

  const stage = React.useRef<Stage>(null);

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
    setTimeout(() => {
      setOffset(offset + 1);
      if (offset > 32) {
        setOffset(0);
      }
    }, 200);
  });

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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      ref={stage}
      width={data.shape?.c}
    >
      <ReactKonva.Layer>
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
            stroke="white"
            strokeWidth={1}
            x={centerX}
            y={centerY}
          />
        )}
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
