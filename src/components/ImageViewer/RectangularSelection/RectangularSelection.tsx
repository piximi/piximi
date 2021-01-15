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
  const [image] = useImage(data.src, "Anonymous");
  const stageRef = React.useRef<Stage>(null);
  const rectangularSelectionRef = React.useRef<Rect>(null);
  const [
    rectangularSelectionX,
    setRectangularSelectionX,
  ] = React.useState<number>();
  const [
    rectangularSelectionY,
    setRectangularSelectionY,
  ] = React.useState<number>();
  const [
    rectangularSelectionHeight,
    setRectangularSelectionHeight,
  ] = React.useState<number>(0);
  const [
    rectangularSelectionWidth,
    setRectangularSelectionWidth,
  ] = React.useState<number>(0);

  const onRectangularSelection = () => {
    if (rectangularSelectionRef && rectangularSelectionRef.current) {
      const mask = rectangularSelectionRef.current.toDataURL({
        callback(data: string) {
          return data;
        },
      });

      const {
        x,
        y,
        width,
        height,
      } = rectangularSelectionRef.current.getClientRect();

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
    onRectangularSelection
  );

  const dashOffset = useMarchingAnts();

  const transformer = useTransformer(
    rectangularSelectionRef,
    annotated,
    annotating
  );

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

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        setRectangularSelectionX(position.x);
        setRectangularSelectionY(position.y);
      }
    }
  };

  const onRectangularSelectionMouseMove = () => {
    if (annotated) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (rectangularSelectionX && rectangularSelectionY && position) {
        setRectangularSelectionHeight(position.y - rectangularSelectionY);

        setRectangularSelectionWidth(position.x - rectangularSelectionX);
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
      ref={stageRef}
      width={data.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onRectangularSelectionMouseDown}
        onMouseMove={onRectangularSelectionMouseMove}
        onMouseUp={onRectangularSelectionMouseUp}
      >
        <ReactKonva.Image image={image} />

        {!annotated &&
          annotating &&
          rectangularSelectionX &&
          rectangularSelectionY && (
            <React.Fragment>
              <ReactKonva.Rect
                x={rectangularSelectionX}
                y={rectangularSelectionY}
                height={rectangularSelectionHeight}
                width={rectangularSelectionWidth}
                stroke="black"
                strokeWidth={1}
              />
              <ReactKonva.Rect
                x={rectangularSelectionX}
                y={rectangularSelectionY}
                height={rectangularSelectionHeight}
                width={rectangularSelectionWidth}
                stroke="white"
                dash={[4, 2]}
                dashOffset={-dashOffset}
                strokeWidth={1}
              />
            </React.Fragment>
          )}

        {annotated &&
          !annotating &&
          rectangularSelectionX &&
          rectangularSelectionY && (
            <ReactKonva.Rect
              dash={[4, 2]}
              dashOffset={-dashOffset}
              height={rectangularSelectionHeight}
              ref={rectangularSelectionRef}
              stroke="white"
              strokeWidth={1}
              fill={toRGBA(category.color, 0.3)}
              width={rectangularSelectionWidth}
              x={rectangularSelectionX}
              y={rectangularSelectionY}
            />
          )}

        {annotated &&
          !annotating &&
          rectangularSelectionX &&
          rectangularSelectionY && (
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
