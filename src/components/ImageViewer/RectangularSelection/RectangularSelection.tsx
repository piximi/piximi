import React from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Box } from "konva/types/shapes/Transformer";
import { Rect } from "konva/types/shapes/Rect";
import { Category } from "../../../types/Category";
import { toRGBA } from "../../../image/toRGBA";
import { useDispatch } from "react-redux";
import { projectSlice } from "../../../store/slices";
import { BoundingBox } from "../../../types/BoundingBox";
import { useMarchingAnts, useSelection, useTransformer } from "../../../hooks";

type RectangularSelectionProps = {
  data: Image;
  category: Category;
};

export const RectangularSelection = ({
  data,
  category,
}: RectangularSelectionProps) => {
  const dispatch = useDispatch();
  const [image] = useImage(data.src);
  const stage = React.useRef<Stage>(null);
  const shapeRef = React.useRef<Rect>(null);
  const [x, setX] = React.useState<number>();
  const [y, setY] = React.useState<number>();
  const [height, setHeight] = React.useState<number>(0);
  const [width, setWidth] = React.useState<number>(0);

  const onSelection = () => {
    if (shapeRef && shapeRef.current) {
      const mask = shapeRef.current.toDataURL({
        callback(data: string) {
          return data;
        },
      });

      const { x, y, width, height } = shapeRef.current.getClientRect();

      const boundingBox: BoundingBox = {
        maximum: {
          r: y + height,
          c: x + width,
        },
        minimum: {
          r: y,
          c: x,
        },
      };

      const payload = {
        boundingBox: boundingBox,
        categoryId: category.id,
        id: data.id,
        mask: mask,
      };

      dispatch(projectSlice.actions.createImageInstance(payload));
    }
  };

  const { annotated, annotating, setAnnotated, setAnnotating } = useSelection(
    onSelection
  );

  const dashOffset = useMarchingAnts();

  const transformer = useTransformer(shapeRef, annotated, annotating);

  const boundBoxFunc = (oldBox: Box, newBox: Box) => {
    if (
      0 <= newBox.x &&
      newBox.width + newBox.x <= data.shape!.c &&
      0 <= newBox.y &&
      newBox.height + newBox.y <= data.shape!.r
    ) {
      return newBox;
    } else {
      return oldBox;
    }
  };

  const onRectangularSelectionMouseDown = () => {
    if (annotated) {
      return;
    }

    setAnnotating(true);

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        setX(position.x);
        setY(position.y);
      }
    }
  };

  const onRectangularSelectionMouseMove = () => {
    if (annotated) {
      return;
    }

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (x && y && position) {
        setHeight(position.y - y);

        setWidth(position.x - x);
      }
    }
  };

  const onRectangularSelectionMouseUp = () => {
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

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
        onMouseDown={onRectangularSelectionMouseDown}
        onMouseMove={onRectangularSelectionMouseMove}
        onMouseUp={onRectangularSelectionMouseUp}
      >
        <ReactKonva.Image image={image} />

        {!annotated && annotating && x && y && (
          <React.Fragment>
            <ReactKonva.Rect
              x={x}
              y={y}
              height={height}
              width={width}
              stroke="black"
              strokeWidth={1}
            />
            <ReactKonva.Rect
              x={x}
              y={y}
              height={height}
              width={width}
              stroke="white"
              dash={[4, 2]}
              dashOffset={-dashOffset}
              strokeWidth={1}
            />
          </React.Fragment>
        )}

        {annotated && !annotating && x && y && (
          <ReactKonva.Rect
            dash={[4, 2]}
            dashOffset={-dashOffset}
            height={height}
            ref={shapeRef}
            stroke="white"
            strokeWidth={1}
            fill={toRGBA(category.color, 0.3)}
            width={width}
            x={x}
            y={y}
          />
        )}

        {annotated && !annotating && x && y && (
          <ReactKonva.Transformer
            anchorFill="#FFF"
            anchorSize={6}
            anchorStroke="#000"
            anchorStrokeWidth={1}
            borderEnabled={false}
            boundBoxFunc={boundBoxFunc}
            keepRatio={false}
            ref={transformer}
            rotateEnabled={false}
          />
        )}
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
