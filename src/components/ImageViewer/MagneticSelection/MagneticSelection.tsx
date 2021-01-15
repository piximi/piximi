import React, { useCallback, useEffect, useState } from "react";
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

  const [downsizedWidth, setDownsizedWidth] = useState<number>(0);
  const [factor, setFactor] = useState<number>(1);

  const [canClose, setCanClose] = useState<boolean>(false);

  const [graph, setGraph] = useState<Graph | null>(null);

  const [pathStrokes, setPathStrokes] = useState<Array<Stroke>>([]);

  const pathFinder = React.useRef<PathFinder<any>>();

  let position: { x: number; y: number } | null = { x: 0, y: 0 };

  const debouncedPosition = useDebounce(position, 20);

  useEffect(
    () => {
      if (debouncedPosition) {
        onMouseMove();
      }
    },
    [debouncedPosition] // Only call effect if debounced search term changes
  );

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
      console.log(img.width, img.height);
      console.log(downsized.width, downsized.height);
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
      position = stage.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
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
              points: [anchor.x, anchor.y, position.x, position.y],
            };

            setStrokes([...strokes, stroke]);

            setAnchor(position);
          } else if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [start.x, start.y, position.x, position.y],
            };

            setStrokes([...strokes, stroke]);
            setAnchor(position);
          } else {
            setAnnotating(true);
            setStart(position);
          }
        }
      }
    }
  };

  // const throttledOnMouseMove = () => {
  //   _.throttle(() => {
  //     console.info("beep");
  //
  //     onMouseMove();
  //   }, 100);
  // }

  const onMouseMove = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      position = stage.current.getPointerPosition();

      if (position) {
        if (!canClose && !isInside(startingAnchorCircle, position)) {
          setCanClose(true);
        }

        let stroke = null;

        if (anchor) {
          stroke = {
            method: Method.Lasso,
            points: [anchor.x, anchor.y, position.x, position.y],
          };
        } else if (start) {
          stroke = {
            method: Method.Lasso,
            points: [start.x, start.y, position.x, position.y],
          };
          if (
            Math.sqrt(
              (position.x - stroke.points[0]) *
                (position.x - stroke.points[0]) +
                (position.y - stroke.points[1]) *
                  (position.y - stroke.points[1])
            ) > 50
          ) {
            if (pathFinder && pathFinder.current && img) {
              const foundPath = pathFinder.current.find(
                getIdx(downsizedWidth, 1)(
                  Math.floor(stroke.points[0] * 0.25),
                  Math.floor(stroke.points[1] * 0.25),
                  0
                ),
                getIdx(downsizedWidth, 1)(
                  Math.floor(position.x * 0.25),
                  Math.floor(position.y * 0.25),
                  0
                )
              );
              const pathCoords = convertPathToCoords(
                foundPath,
                downsizedWidth,
                0.25
              );
              setPathStrokes(convertCoordsToStrokes(pathCoords));
              setDidFindPath(true);
            }
          }
        }

        if (stroke) {
          strokes.splice(strokes.length - 1, 1, stroke);
          setStrokes(strokes.concat());
        }
      }
    }
  };

  const onMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      position = stage.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [position.x, position.y, start.x, start.y],
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
            setAnchor(position);
            if (start) {
              const stroke = {
                method: Method.Lasso,
                points: [start!.x, start!.y, position.x, position.y],
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
        onMouseMove={() => {}}
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
