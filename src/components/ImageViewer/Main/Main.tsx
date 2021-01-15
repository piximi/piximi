import Box from "@material-ui/core/Box";
import React, { useRef } from "react";
import { Category } from "../../../types/Category";
import { Image as PiximiImage } from "../../../types/Image";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { useStyles } from "./Main.css";
import * as ReactKonva from "react-konva";
import { Stage } from "konva/types/Stage";
import useImage from "use-image";
import { useMarchingAnts, useSelection } from "../../../hooks";
import { Rect } from "konva/types/shapes/Rect";
import { BoundingBox } from "../../../types/BoundingBox";
import { projectSlice } from "../../../store/slices";
import { useDispatch } from "react-redux";
import { toRGBA } from "../../../image/toRGBA";

type MainProps = {
  activeCategory: Category;
  activeOperation: ImageViewerOperation;
  image: PiximiImage;
};

export const Main = ({ activeCategory, activeOperation, image }: MainProps) => {
  const dispatch = useDispatch();
  const [img] = useImage(image.src, "Anonymous");
  const dashOffset = useMarchingAnts();
  const classes = useStyles();
  const stageRef = useRef<Stage>(null);

  const onColorSelection = () => {};

  const onEllipticalSelection = () => {};

  const onLassoSelection = () => {};

  const onMagneticSelection = () => {};

  const onObjectSelection = () => {};

  const onPolygonalSelection = () => {};

  const onQuickSelection = () => {};

  /*
   * Rectangular selection
   */
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
        categoryId: activeCategory.id,
        id: image.id,
        mask: mask,
      };

      dispatch(projectSlice.actions.createImageInstance(payload));
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

  const RectangularSelection = () => {
    return (
      <React.Fragment>
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
              fill={toRGBA(activeCategory.color, 0.3)}
              width={rectangularSelectionWidth}
              x={rectangularSelectionX}
              y={rectangularSelectionY}
            />
          )}
      </React.Fragment>
    );
  };

  const onSelection = () => {
    switch (activeOperation) {
      case ImageViewerOperation.ColorAdjustment:
        return;
      case ImageViewerOperation.ColorSelection:
        return onColorSelection();
      case ImageViewerOperation.EllipticalSelection:
        return onEllipticalSelection();
      case ImageViewerOperation.Hand:
        return;
      case ImageViewerOperation.LassoSelection:
        return onLassoSelection();
      case ImageViewerOperation.MagneticSelection:
        return onMagneticSelection();
      case ImageViewerOperation.ObjectSelection:
        return onObjectSelection();
      case ImageViewerOperation.PolygonalSelection:
        return onPolygonalSelection();
      case ImageViewerOperation.QuickSelection:
        return onQuickSelection();
      case ImageViewerOperation.RectangularSelection:
        return onRectangularSelection();
      case ImageViewerOperation.Zoom:
        return;
    }
  };

  const { annotated, annotating, setAnnotated, setAnnotating } = useSelection(
    onSelection
  );

  const onMouseDown = () => {
    switch (activeOperation) {
      case ImageViewerOperation.ColorAdjustment:
        break;
      case ImageViewerOperation.ColorSelection:
        break;
      case ImageViewerOperation.EllipticalSelection:
        break;
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        break;
      case ImageViewerOperation.MagneticSelection:
        break;
      case ImageViewerOperation.ObjectSelection:
        break;
      case ImageViewerOperation.PolygonalSelection:
        break;
      case ImageViewerOperation.QuickSelection:
        break;
      case ImageViewerOperation.RectangularSelection:
        return onRectangularSelectionMouseDown();
      case ImageViewerOperation.Zoom:
        break;
    }
  };

  const onMouseMove = () => {
    switch (activeOperation) {
      case ImageViewerOperation.ColorAdjustment:
        break;
      case ImageViewerOperation.ColorSelection:
        break;
      case ImageViewerOperation.EllipticalSelection:
        break;
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        break;
      case ImageViewerOperation.MagneticSelection:
        break;
      case ImageViewerOperation.ObjectSelection:
        break;
      case ImageViewerOperation.PolygonalSelection:
        break;
      case ImageViewerOperation.QuickSelection:
        break;
      case ImageViewerOperation.RectangularSelection:
        return onRectangularSelectionMouseMove();
      case ImageViewerOperation.Zoom:
        break;
    }
  };

  const onMouseUp = () => {
    switch (activeOperation) {
      case ImageViewerOperation.ColorAdjustment:
        break;
      case ImageViewerOperation.ColorSelection:
        break;
      case ImageViewerOperation.EllipticalSelection:
        break;
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        break;
      case ImageViewerOperation.MagneticSelection:
        break;
      case ImageViewerOperation.ObjectSelection:
        break;
      case ImageViewerOperation.PolygonalSelection:
        break;
      case ImageViewerOperation.QuickSelection:
        break;
      case ImageViewerOperation.RectangularSelection:
        return onRectangularSelectionMouseUp();
      case ImageViewerOperation.Zoom:
        break;
    }
  };

  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />

      <Box alignItems="center" display="flex" justifyContent="center">
        <ReactKonva.Stage
          globalCompositeOperation="destination-over"
          height={image.shape?.r}
          ref={stageRef}
          width={image.shape?.c}
        >
          <ReactKonva.Layer
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            <ReactKonva.Image image={img} />

            {activeOperation === ImageViewerOperation.RectangularSelection && (
              <RectangularSelection />
            )}
          </ReactKonva.Layer>
        </ReactKonva.Stage>
      </Box>
    </main>
  );
};
