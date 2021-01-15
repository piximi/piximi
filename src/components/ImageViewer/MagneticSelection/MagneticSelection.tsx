import React, { useEffect, useRef, useState } from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Circle } from "konva/types/shapes/Circle";
import { Transformer } from "konva/types/shapes/Transformer";
import * as _ from "underscore";
import { Line } from "konva/types/shapes/Line";
import { Image as ImageKonvaType } from "konva/types/shapes/Image";
import useImage from "use-image";
import {
  convertPathToCoords,
  createPathFinder,
  makeGraph,
} from "../../../image/GraphHelper";
import { Image } from "image-js";
import { Graph } from "ngraph.graph";
import { PathFinder } from "ngraph.path";
import { getIdx } from "../../../image/imageHelper";

export enum Method {
  Elliptical,
  Lasso,
  Magnetic,
  Polygonal,
  Quick,
  Rectangular,
}

type Anchor = {
  x: number;
  y: number;
};

type KonvaLassoSelectionCanvasProps = {
  image: ImageType;
};

type Stroke = {
  method: Method;
  points: Array<number>;
};

// Hook
function useDebounce(value: { x: number; y: number } | null, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        if (value) {
          setDebouncedValue(value);
        }
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}

const computeCroppedEdges = (
  edges: Uint8ClampedArray,
  crop: number,
  anchor: { x: number; y: number },
  width: number,
  height: number
): number[] => {
  let croppedEdges: number[] = [];
  for (let j = anchor.y - crop; j < anchor.y + crop; j++) {
    for (let i = anchor.x - crop; i < anchor.x + crop; i++) {
      croppedEdges.push(edges[(width * j + i) * 4]);
    }
  }
  return croppedEdges;
};

const convertCoordsToStrokes = (pathCoords: number[][]): Array<Stroke> => {
  const pathStrokes = [];
  for (let i = 0; i < pathCoords.length - 1; i++) {
    const [startX, startY] = pathCoords[i];
    const [endX, endY] = pathCoords[i + 1];
    const stroke: Stroke = {
      method: Method.Lasso,
      points: [startX, startY, endX, endY],
    };
    pathStrokes.push(stroke);
  }
  return pathStrokes;
};

const MarchingAnts = ({ stroke }: { stroke: Stroke }) => {
  return (
    <React.Fragment>
      <ReactKonva.Line points={stroke.points} stroke="#FFF" strokeWidth={1} />

      <ReactKonva.Line
        dash={[4, 2]}
        points={stroke.points}
        stroke="#FFF"
        strokeWidth={1}
      />
    </React.Fragment>
  );
};

export const MagneticSelection = ({
  image,
}: KonvaLassoSelectionCanvasProps) => {
  const [img] = useImage(image.src, "Anonymous");

  const stage = React.useRef<Stage>(null);
  const startingAnchorCircle = React.useRef<Circle>(null);
  const transformer = React.useRef<Transformer>(null);
  const annotationRef = React.useRef<Line>(null);
  const imageRef = React.useRef<ImageKonvaType>(null);

  const [anchor, setAnchor] = useState<Anchor>();
  const [annotated, setAnnotated] = useState<boolean>(false);
  const [annotating, setAnnotating] = useState<boolean>(false);
  const [annotation, setAnnotation] = useState<Stroke>();
  const [didFindPath, setDidFindPath] = useState<boolean>(false);
  const [start, setStart] = useState<Anchor>();
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);
  const [magnetize, setMagnetize] = useState<boolean>(false);

  const [downsizedWidth, setDownsizedWidth] = useState<number>(0);
  const [factor, setFactor] = useState<number>(1);

  const [canClose, setCanClose] = useState<boolean>(false);

  const [graph, setGraph] = useState<Graph | null>(null);

  const [pathStrokes, setPathStrokes] = useState<Array<Stroke>>([]);

  const pathFinder = React.useRef<PathFinder<any>>();

  const position = React.useRef<{ x: number; y: number } | null>(null);
  // const startPosition = React.useRef<{ x: number; y: number } | null>(null);

  const debouncedPosition = useDebounce(position.current, 20);

  useEffect(() => {
    if (debouncedPosition && start) {
      if (magnetize) {
        console.log(debouncedPosition.x, debouncedPosition.y);
        console.log(start.x, start.y);
        if (pathFinder && pathFinder.current && img) {
          const foundPath = pathFinder.current.find(
            getIdx(downsizedWidth, 1)(
              Math.floor(start.x * 0.25),
              Math.floor(start.y * 0.25),
              0
            ),
            getIdx(downsizedWidth, 1)(
              Math.floor(debouncedPosition.x * 0.25),
              Math.floor(debouncedPosition.y * 0.25),
              0
            )
          );
          const pathCoords = convertPathToCoords(
            foundPath,
            downsizedWidth,
            0.25
          );
          setStrokes(convertCoordsToStrokes(pathCoords));
          setDidFindPath(true);
        }
      }
    }
  }, [debouncedPosition, start]);

  React.useEffect(() => {
    if (graph && img) {
      pathFinder.current = createPathFinder(graph, downsizedWidth);
    }
  }, [graph, img]);

  React.useEffect(() => {
    if (imageRef && imageRef.current) {
      imageRef.current.cache();

      imageRef.current.getLayer()?.batchDraw();
    }
  });

  React.useEffect(() => {
    const loadImg = async () => {
      const img = await Image.load(image.src);
      const grey = img.grey();
      const edges = grey.sobelFilter();
      setDownsizedWidth(img.width * 0.25);
      const downsized = edges.resize({ factor: 0.25 });
      setGraph(makeGraph(downsized.data, downsized.height, downsized.width));
    };
    loadImg();
  }, [image.src]);

  React.useEffect(() => {
    if (
      annotated &&
      annotationRef &&
      annotationRef.current &&
      transformer &&
      transformer.current
    ) {
      transformer.current.nodes([annotationRef.current]);

      transformer.current.getLayer()?.batchDraw();
    }
  }, [annotated]);

  const isInside = (
    startingAnchorCircle: React.RefObject<Circle>,
    position: { x: number; y: number }
  ) => {
    if (startingAnchorCircle && startingAnchorCircle.current) {
      const rectangle = startingAnchorCircle.current.getClientRect();
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
    const inside = isInside(startingAnchorCircle, position);
    if (strokes && strokes.length > 0) {
      return inside && canClose;
    }
  };

  const onMouseDown = () => {
    if (annotated) return;

    if (stage && stage.current) {
      position.current = stage.current.getPointerPosition();

      if (position && position.current) {
        if (connected(position.current)) {
          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };

          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
          setStrokes([]);
        } else {
          if (anchor) {
            const stroke = {
              method: Method.Lasso,
              points: [
                anchor.x,
                anchor.y,
                position.current.x,
                position.current.y,
              ],
            };

            setStrokes([...strokes, stroke]);

            setAnchor(position.current);
          } else if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [
                start.x,
                start.y,
                position.current.x,
                position.current.y,
              ],
            };

            setStrokes([...strokes, stroke]);
            setAnchor(position.current);
          } else {
            setAnnotating(true);
            setStart(position.current);
          }
        }
      }
    }
  };

  const onMouseMove = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      position.current = stage.current.getPointerPosition();

      if (position && position.current) {
        if (!canClose && !isInside(startingAnchorCircle, position.current)) {
          setCanClose(true);
        }

        if (anchor) {
          const stroke = {
            method: Method.Lasso,
            points: [
              anchor.x,
              anchor.y,
              position.current.x,
              position.current.y,
            ],
          };
          strokes.splice(strokes.length - 1, 1, stroke);
          setStrokes(strokes.concat());
        } else if (start) {
          const result = Math.sqrt(
            (position.current.x - start.x) * (position.current.x - start.x) +
              (position.current.y - start.y) * (position.current.y - start.y)
          );
          console.log(result);

          if (result > 50) {
            setMagnetize(true);
          }

          const stroke = {
            method: Method.Lasso,
            points: [start.x, start.y, position.current.x, position.current.y],
          };
          strokes.splice(strokes.length - 1, 1, stroke);
          setStrokes(strokes.concat());
        }
      }
    }
  };
  //
  // const onMouseMove = () => {
  //   if (annotated) return;
  //
  //   if (!annotating) return;
  //
  //   if (stage && stage.current) {
  //     const position = stage.current.getPointerPosition();
  //
  //     if (position) {
  //       if (!canClose && !isInside(startingAnchorCircle, position)) {
  //         setCanClose(true);
  //       }
  //
  //       if (anchor) {
  //         const stroke = {
  //           method: Method.Lasso,
  //           points: [anchor.x, anchor.y, position.x, position.y],
  //         };
  //         strokes.splice(strokes.length - 1, 1, stroke);
  //         setStrokes(strokes.concat());
  //       } else if (start) {
  //         const stroke = {
  //           method: Method.Lasso,
  //           points: [start.x, start.y, position.x, position.y],
  //         };
  //         strokes.splice(strokes.length - 1, 1, stroke);
  //         setStrokes(strokes.concat());
  //       }
  //     }
  //   }
  // };

  const onMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      position.current = stage.current.getPointerPosition();

      if (position && position.current) {
        if (connected(position.current)) {
          if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [
                position.current.x,
                position.current.y,
                start.x,
                start.y,
              ],
            };

            setStrokes([...strokes, stroke]);
          }

          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };

          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
          setStrokes([]);
        } else {
          if (strokes.length === 1) {
            setAnchor(position.current);
            if (start) {
              const stroke = {
                method: Method.Lasso,
                points: [
                  start!.x,
                  start!.y,
                  position.current.x,
                  position.current.y,
                ],
              };
              setStrokes([...strokes, stroke]);
            }
          }
        }
      }
    }
  };

  const Anchor = () => {
    if (annotating && anchor && strokes.length > 1) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={anchor.x}
          y={anchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const StartingAnchor = () => {
    if (annotating && start) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={startingAnchorCircle}
          stroke="#FFF"
          strokeWidth={1}
          x={start.x}
          y={start.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={image.shape?.r}
      ref={stage}
      width={image.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <ReactKonva.Image image={img} ref={imageRef} />

        <StartingAnchor />

        {!annotated &&
          annotating &&
          strokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts key={key} stroke={stroke} />
          ))}

        <Anchor />

        {annotation && annotated && !annotating && (
          <MarchingAnts stroke={annotation} />
        )}

        {didFindPath &&
          pathStrokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts key={key} stroke={stroke} />
          ))}

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
