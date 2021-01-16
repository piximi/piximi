import * as ReactKonva from "react-konva";
import Box from "@material-ui/core/Box";
import React, { useRef, useState } from "react";
import useImage from "use-image";
import { BoundingBox } from "../../../types/BoundingBox";
import { Category } from "../../../types/Category";
import { Ellipse } from "konva/types/shapes/Ellipse";
import { Image as PiximiImage } from "../../../types/Image";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { Rect } from "konva/types/shapes/Rect";
import { Stage } from "konva/types/Stage";
import { projectSlice } from "../../../store/slices";
import { toRGBA } from "../../../image/toRGBA";
import { useDispatch } from "react-redux";
import { useMarchingAnts, useSelection } from "../../../hooks";
import { useStyles } from "./Main.css";
import { Circle } from "konva/types/shapes/Circle";
import { Line } from "konva/types/shapes/Line";
import * as _ from "underscore";

type LassoSelectionAnchor = {
  x: number;
  y: number;
};

type LassoSelectionStroke = {
  points: Array<number>;
};

type PolygonalSelectionAnchor = {
  x: number;
  y: number;
};

type PolygonalSelectionStroke = {
  points: Array<number>;
};

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
  const lassoSelectionRef = React.useRef<Line>(null);

  const lassoSelectionStartingAnchorCircleRef = React.useRef<Circle>(null);

  const [
    lassoSelectionAnchor,
    setLassoSelectionAnchor,
  ] = useState<LassoSelectionAnchor>();

  const [
    lassoSelectionAnnotation,
    setLassoSelectionAnnotation,
  ] = useState<LassoSelectionStroke>();

  const [lassoSelectionCanClose, setLassoSelectionCanClose] = useState<boolean>(
    false
  );

  const [
    lassoSelectionEarlyRelease,
    setLassoSelectionEarlyRelease,
  ] = useState<boolean>(false);

  const [
    lassoSelectionStart,
    setLassoSelectionStart,
  ] = useState<LassoSelectionAnchor>();

  const [lassoSelectionStrokes, setLassoSelectionStrokes] = useState<
    Array<LassoSelectionStroke>
  >([]);

  const LassoSelectionAnchor = () => {
    if (
      annotating &&
      lassoSelectionAnchor &&
      lassoSelectionStrokes.length > 1
    ) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={lassoSelectionAnchor.x}
          y={lassoSelectionAnchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const LassoSelectionStartingAnchor = () => {
    if (annotating && lassoSelectionStart) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={lassoSelectionStartingAnchorCircleRef}
          stroke="#FFF"
          strokeWidth={1}
          x={lassoSelectionStart.x}
          y={lassoSelectionStart.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const LassoSelection = () => {
    if (annotated && !annotating) {
      return (
        <React.Fragment>
          <LassoSelectionStartingAnchor />

          <LassoSelectionAnchor />

          {lassoSelectionAnnotation && (
            <React.Fragment>
              <ReactKonva.Line
                points={lassoSelectionAnnotation.points}
                stroke="black"
                strokeWidth={1}
              />

              <ReactKonva.Line
                closed
                dash={[4, 2]}
                dashOffset={-dashOffset}
                fill={toRGBA(activeCategory.color, 0.3)}
                points={lassoSelectionAnnotation.points}
                ref={lassoSelectionRef}
                stroke="white"
                strokeWidth={1}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      );
    } else if (!annotated && annotating) {
      return (
        <React.Fragment>
          <LassoSelectionStartingAnchor />

          {lassoSelectionStrokes.map(
            (stroke: LassoSelectionStroke, key: number) => {
              return (
                <React.Fragment>
                  <ReactKonva.Line
                    key={key}
                    points={stroke.points}
                    stroke="black"
                    strokeWidth={1}
                  />

                  <ReactKonva.Line
                    closed={false}
                    dash={[4, 2]}
                    dashOffset={-dashOffset}
                    fill="None"
                    key={key}
                    points={stroke.points}
                    stroke="white"
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            }
          )}
        </React.Fragment>
      );
    } else {
      return null;
    }
  };

  const isInside = (
    startingAnchorCircle: React.RefObject<Circle>,
    position: { x: number; y: number }
  ) => {
    if (
      lassoSelectionStartingAnchorCircleRef &&
      lassoSelectionStartingAnchorCircleRef.current
    ) {
      const rectangle = lassoSelectionStartingAnchorCircleRef.current.getClientRect();
      return (
        rectangle.x <= position.x &&
        position.x <= rectangle.x + rectangle.width &&
        rectangle.y <= position.y &&
        position.y <= rectangle.y + rectangle.height
      );
    } else {
      return false;
    }
  };

  const connected = (position: { x: number; y: number }) => {
    const inside = isInside(lassoSelectionStartingAnchorCircleRef, position);
    if (lassoSelectionStrokes && lassoSelectionStrokes.length > 0) {
      return inside && lassoSelectionCanClose;
    }
  };

  const onLassoSelection = () => {};

  const onLassoSelectionMouseDown = () => {
    if (annotated) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          const stroke: LassoSelectionStroke = {
            points: _.flatten(
              lassoSelectionStrokes.map(
                (stroke: LassoSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);
          setAnnotating(false);
          setLassoSelectionAnnotation(stroke);
          setLassoSelectionStrokes([]);
        } else {
          if (!lassoSelectionEarlyRelease) {
            if (lassoSelectionAnchor) {
              const stroke = {
                points: [
                  lassoSelectionAnchor.x,
                  lassoSelectionAnchor.y,
                  position.x,
                  position.y,
                ],
              };

              setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);

              setLassoSelectionAnchor(position);
            } else {
              setAnnotating(true);

              setLassoSelectionStart(position);

              const stroke: LassoSelectionStroke = {
                points: [position.x, position.y],
              };

              setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
            }
          } else {
            setLassoSelectionEarlyRelease(false);
          }
        }
      }
    }
  };

  const onLassoSelectionMouseMove = () => {
    if (annotated) {
      return;
    }

    if (!annotating) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (
          !lassoSelectionCanClose &&
          !isInside(lassoSelectionStartingAnchorCircleRef, position)
        ) {
          setLassoSelectionCanClose(true);
        }

        if (lassoSelectionAnchor && !lassoSelectionEarlyRelease) {
          const stroke = {
            points: [
              lassoSelectionAnchor.x,
              lassoSelectionAnchor.y,
              position.x,
              position.y,
            ],
          };

          if (lassoSelectionStrokes.length > 2) {
            lassoSelectionStrokes.splice(
              lassoSelectionStrokes.length - 1,
              1,
              stroke
            );

            setLassoSelectionStrokes(lassoSelectionStrokes.concat());
          } else {
            setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
          }
        } else {
          let stroke = lassoSelectionStrokes[lassoSelectionStrokes.length - 1];

          stroke.points = [...stroke.points, position.x, position.y];

          lassoSelectionStrokes.splice(
            lassoSelectionStrokes.length - 1,
            1,
            stroke
          );

          setLassoSelectionStrokes(lassoSelectionStrokes.concat());

          if (connected(position)) {
            //  TODO:
          } else {
            //  TODO:
          }
        }
      }
    }
  };

  const onLassoSelectionMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (lassoSelectionStart) {
            const stroke = {
              points: [
                position.x,
                position.y,
                lassoSelectionStart.x,
                lassoSelectionStart.y,
              ],
            };

            setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
          }

          const stroke: LassoSelectionStroke = {
            points: _.flatten(
              lassoSelectionStrokes.map(
                (stroke: LassoSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);
          setAnnotating(false);
          setLassoSelectionAnnotation(stroke);
          setLassoSelectionStrokes([]);
        } else {
          if (
            !lassoSelectionAnchor &&
            lassoSelectionStrokes[lassoSelectionStrokes.length - 1].points
              .length <= 2
          ) {
            setLassoSelectionEarlyRelease(true);
          }
          setLassoSelectionAnchor(position);
        }
      }
    }
  };

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
  const polygonalSelectionRef = React.useRef<Line>(null);

  const polygonalSelectionStartingAnchorCircleRef = React.useRef<Circle>(null);

  const [
    polygonalSelectionAnchor,
    setPolygonalSelectionAnchor,
  ] = useState<PolygonalSelectionAnchor>();

  const [
    polygonalSelectionAnnotation,
    setPolygonalSelectionAnnotation,
  ] = useState<PolygonalSelectionStroke>();

  const [
    polygonalSelectionCanClose,
    setPolygonalSelectionCanClose,
  ] = useState<boolean>(false);

  const [
    polygonalSelectionStart,
    setPolygonalSelectionStart,
  ] = useState<PolygonalSelectionAnchor>();

  const [polygonalSelectionStrokes, setPolygonalSelectionStrokes] = useState<
    Array<PolygonalSelectionStroke>
  >([]);

  const PolygonalSelectionAnchor = () => {
    if (
      annotating &&
      polygonalSelectionAnchor &&
      polygonalSelectionStrokes.length > 1
    ) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={polygonalSelectionAnchor.x}
          y={polygonalSelectionAnchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const PolygonalSelectionStartingAnchor = () => {
    if (annotating && polygonalSelectionStart) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={polygonalSelectionStartingAnchorCircleRef}
          stroke="#FFF"
          strokeWidth={1}
          x={polygonalSelectionStart.x}
          y={polygonalSelectionStart.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const PolygonalSelection = () => {
    if (annotated && !annotating) {
      return (
        <React.Fragment>
          <PolygonalSelectionStartingAnchor />

          <PolygonalSelectionAnchor />

          {polygonalSelectionAnnotation && (
            <React.Fragment>
              <ReactKonva.Line
                points={polygonalSelectionAnnotation.points}
                stroke="black"
                strokeWidth={1}
              />

              <ReactKonva.Line
                closed
                dash={[4, 2]}
                dashOffset={-dashOffset}
                fill={activeCategory.color}
                points={polygonalSelectionAnnotation.points}
                stroke="white"
                strokeWidth={1}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      );
    } else if (!annotated && annotating) {
      return (
        <React.Fragment>
          <PolygonalSelectionStartingAnchor />

          {polygonalSelectionStrokes.map(
            (stroke: PolygonalSelectionStroke, key: number) => {
              return (
                <React.Fragment>
                  <ReactKonva.Line
                    key={key}
                    points={stroke.points}
                    stroke="black"
                    strokeWidth={1}
                  />

                  <ReactKonva.Line
                    closed={false}
                    dash={[4, 2]}
                    dashOffset={-dashOffset}
                    fill="None"
                    key={key}
                    points={stroke.points}
                    stroke="white"
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            }
          )}

          <PolygonalSelectionAnchor />
        </React.Fragment>
      );
    } else {
      return null;
    }
  };

  const onPolygonalSelection = () => {};

  const onPolygonalSelectionMouseDown = () => {
    if (annotated) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          const stroke: PolygonalSelectionStroke = {
            points: _.flatten(
              polygonalSelectionStrokes.map(
                (stroke: PolygonalSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);

          setAnnotating(false);

          setPolygonalSelectionAnnotation(stroke);

          setPolygonalSelectionStrokes([]);
        } else {
          if (polygonalSelectionAnchor) {
            const stroke = {
              points: [
                polygonalSelectionAnchor.x,
                polygonalSelectionAnchor.y,
                position.x,
                position.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);

            setPolygonalSelectionAnchor(position);
          } else if (polygonalSelectionStart) {
            const stroke = {
              points: [
                polygonalSelectionStart.x,
                polygonalSelectionStart.y,
                position.x,
                position.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);

            setPolygonalSelectionAnchor(position);
          } else {
            setAnnotating(true);

            setPolygonalSelectionStart(position);
          }
        }
      }
    }
  };

  const onPolygonalSelectionMouseMove = () => {
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (
          !polygonalSelectionCanClose &&
          !isInside(polygonalSelectionStartingAnchorCircleRef, position)
        ) {
          setPolygonalSelectionCanClose(true);
        }

        if (polygonalSelectionAnchor) {
          const stroke = {
            points: [
              polygonalSelectionAnchor.x,
              polygonalSelectionAnchor.y,
              position.x,
              position.y,
            ],
          };
          polygonalSelectionStrokes.splice(
            polygonalSelectionStrokes.length - 1,
            1,
            stroke
          );

          setPolygonalSelectionStrokes(polygonalSelectionStrokes.concat());
        } else if (polygonalSelectionStart) {
          const stroke = {
            points: [
              polygonalSelectionStart.x,
              polygonalSelectionStart.y,
              position.x,
              position.y,
            ],
          };

          polygonalSelectionStrokes.splice(
            polygonalSelectionStrokes.length - 1,
            1,
            stroke
          );

          setPolygonalSelectionStrokes(polygonalSelectionStrokes.concat());
        }
      }
    }
  };

  const onPolygonalSelectionMouseUp = () => {
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (polygonalSelectionStart) {
            const stroke = {
              points: [
                position.x,
                position.y,
                polygonalSelectionStart.x,
                polygonalSelectionStart.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);
          }

          const stroke: PolygonalSelectionStroke = {
            points: _.flatten(
              polygonalSelectionStrokes.map(
                (stroke: PolygonalSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);

          setAnnotating(false);

          setPolygonalSelectionAnnotation(stroke);

          setPolygonalSelectionStrokes([]);
        } else {
          if (polygonalSelectionStrokes.length === 1) {
            setPolygonalSelectionAnchor(position);

            if (polygonalSelectionStart) {
              const stroke = {
                points: [
                  polygonalSelectionStart!.x,
                  polygonalSelectionStart!.y,
                  position.x,
                  position.y,
                ],
              };

              setPolygonalSelectionStrokes([
                ...polygonalSelectionStrokes,
                stroke,
              ]);
            }
          }
        }
      }
    }
  };

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
