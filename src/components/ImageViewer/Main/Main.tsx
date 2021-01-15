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
import { Ellipse } from "konva/types/shapes/Ellipse";

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

  /*
   * Color selection
   */
  const ColorSelection = () => {
    return null;
  };

  const onColorSelection = () => {};

  const onColorSelectionMouseDown = () => {};

  const onColorSelectionMouseMove = () => {};

  const onColorSelectionMouseUp = () => {};

  /*
   * Elliptical selection
   */
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

  const EllipticalSelection = () => {
    if (annotated && !annotating) {
      return (
        <ReactKonva.Ellipse
          dash={[4, 2]}
          dashOffset={-dashOffset}
          radiusX={ellipticalSelectionRadiusX}
          radiusY={ellipticalSelectionRadiusY}
          ref={ellipticalSelectionRef}
          stroke="white"
          strokeWidth={1}
          x={ellipticalSelectionCenterX}
          y={ellipticalSelectionCenterY}
          fill={toRGBA(activeCategory.color, 0.3)}
        />
      );
    } else if (!annotated && annotating) {
      return (
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
            dashOffset={-dashOffset}
            radiusX={ellipticalSelectionRadiusX}
            radiusY={ellipticalSelectionRadiusY}
            stroke="white"
            strokeWidth={1}
            x={ellipticalSelectionCenterX}
            y={ellipticalSelectionCenterY}
          />
        </React.Fragment>
      );
    } else {
      return null;
    }
  };

  const onEllipticalSelection = () => {};

  const onEllipticalSelectionMouseDown = () => {
    if (annotated) {
      return;
    }

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
    if (annotated) {
      return;
    }

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
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

    setAnnotated(true);

    setAnnotating(false);
  };

  /*
   * Lasso selection
   */
  const LassoSelection = () => {
    return null;
  };

  const onLassoSelection = () => {};

  const onLassoSelectionMouseDown = () => {};

  const onLassoSelectionMouseMove = () => {};

  const onLassoSelectionMouseUp = () => {};

  /*
   * Magnetic selection
   */
  const MagneticSelection = () => {
    return null;
  };

  const onMagneticSelection = () => {};

  const onMagneticSelectionMouseDown = () => {};

  const onMagneticSelectionMouseMove = () => {};

  const onMagneticSelectionMouseUp = () => {};

  /*
   * Object selection
   */
  const ObjectSelection = () => {
    return null;
  };

  const onObjectSelection = () => {};

  const onObjectSelectionMouseDown = () => {};

  const onObjectSelectionMouseMove = () => {};

  const onObjectSelectionMouseUp = () => {};

  /*
   * Polygonal selection
   */
  const PolygonalSelection = () => {
    return null;
  };

  const onPolygonalSelection = () => {};

  const onPolygonalSelectionMouseDown = () => {};

  const onPolygonalSelectionMouseMove = () => {};

  const onPolygonalSelectionMouseUp = () => {};

  /*
   * Quick selection
   */
  const QuickSelection = () => {
    return null;
  };

  const onQuickSelection = () => {};

  const onQuickSelectionMouseDown = () => {};

  const onQuickSelectionMouseMove = () => {};

  const onQuickSelectionMouseUp = () => {};

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
    if (annotated && !annotating) {
      return (
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
      );
    } else if (!annotated && annotating) {
      return (
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
      );
    } else {
      return null;
    }
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
        return onColorSelectionMouseDown();
      case ImageViewerOperation.EllipticalSelection:
        return onEllipticalSelectionMouseDown();
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        return onLassoSelectionMouseDown();
      case ImageViewerOperation.MagneticSelection:
        return onMagneticSelectionMouseDown();
      case ImageViewerOperation.ObjectSelection:
        return onObjectSelectionMouseDown();
      case ImageViewerOperation.PolygonalSelection:
        return onPolygonalSelectionMouseDown();
      case ImageViewerOperation.QuickSelection:
        return onRectangularSelectionMouseDown();
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
        return onColorSelectionMouseMove();
      case ImageViewerOperation.EllipticalSelection:
        return onEllipticalSelectionMouseMove();
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        return onLassoSelectionMouseMove();
      case ImageViewerOperation.MagneticSelection:
        return onMagneticSelectionMouseMove();
      case ImageViewerOperation.ObjectSelection:
        return onObjectSelectionMouseMove();
      case ImageViewerOperation.PolygonalSelection:
        return onPolygonalSelectionMouseMove();
      case ImageViewerOperation.QuickSelection:
        return onRectangularSelectionMouseMove();
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
        return onColorSelectionMouseUp();
      case ImageViewerOperation.EllipticalSelection:
        return onEllipticalSelectionMouseUp();
      case ImageViewerOperation.Hand:
        break;
      case ImageViewerOperation.LassoSelection:
        return onLassoSelectionMouseUp();
      case ImageViewerOperation.MagneticSelection:
        return onMagneticSelectionMouseUp();
      case ImageViewerOperation.ObjectSelection:
        return onObjectSelectionMouseUp();
      case ImageViewerOperation.PolygonalSelection:
        return onPolygonalSelectionMouseUp();
      case ImageViewerOperation.QuickSelection:
        return onRectangularSelectionMouseUp();
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

            {activeOperation === ImageViewerOperation.ColorSelection && (
              <ColorSelection />
            )}
            {activeOperation === ImageViewerOperation.EllipticalSelection && (
              <EllipticalSelection />
            )}
            {activeOperation === ImageViewerOperation.LassoSelection && (
              <LassoSelection />
            )}
            {activeOperation === ImageViewerOperation.MagneticSelection && (
              <MagneticSelection />
            )}
            {activeOperation === ImageViewerOperation.ObjectSelection && (
              <ObjectSelection />
            )}
            {activeOperation === ImageViewerOperation.PolygonalSelection && (
              <PolygonalSelection />
            )}
            {activeOperation === ImageViewerOperation.QuickSelection && (
              <QuickSelection />
            )}
            {activeOperation === ImageViewerOperation.RectangularSelection && (
              <RectangularSelection />
            )}
          </ReactKonva.Layer>
        </ReactKonva.Stage>
      </Box>
    </main>
  );
};
