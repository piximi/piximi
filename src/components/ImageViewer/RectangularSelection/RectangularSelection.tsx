import React, { useEffect, useState } from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Transformer } from "konva/types/shapes/Transformer";
import { Rect } from "konva/types/shapes/Rect";
import { Category } from "../../../types/Category";
import { toRGBA } from "../../../image/toRGBA";
import { useDispatch } from "react-redux";
import { applicationSlice, projectSlice } from "../../../store/slices";
import { BoundingBox } from "../../../types/BoundingBox";
export const useKeyPress = (key: string, action: () => void) => {
  useEffect(() => {
    function onKeyup(e: any) {
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, [action, key]);
};
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
  const transformer = React.useRef<Transformer>(null);
  const shapeRef = React.useRef<Rect>(null);
  const [x, setX] = React.useState<number>();
  const [y, setY] = React.useState<number>();
  const [height, setHeight] = React.useState<number>(0);
  const [width, setWidth] = React.useState<number>(0);
  const [annotated, setAnnotated] = useState<boolean>();
  const [annotating, setAnnotating] = useState<boolean>();
  const [offset, setOffset] = useState<number>(0);
  useKeyPress("Escape", () => {
    setAnnotating(false);
    setAnnotated(false);
  });
  useKeyPress("Enter", () => {
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
    setAnnotating(false);
    setAnnotated(false);
  });
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
        setX(position.x);
        setY(position.y);
      }
    }
  };
  const onMouseMove = () => {
    if (annotated) return;
    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();
      if (x && y && position) {
        setHeight(position.y - y);
        setWidth(position.x - x);
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
              dashOffset={-offset}
              strokeWidth={1}
            />
          </React.Fragment>
        )}
        {annotated && !annotating && x && y && (
          <ReactKonva.Rect
            dash={[4, 2]}
            dashOffset={-offset}
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
            anchorStroke="#000"
            anchorStrokeWidth={1}
            anchorSize={6}
            borderEnabled={false}
            ref={transformer}
            rotateEnabled={false}
          />
        )}
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
