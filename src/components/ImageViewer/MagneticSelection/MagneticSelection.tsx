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
import { useDebounce } from "../../../hooks";

type Anchor = {
  x: number;
  y: number;
};

type KonvaLassoSelectionCanvasProps = {
  image: ImageType;
};

type Stroke = {
  points: Array<number>;
};

const convertCoordsToStrokes = (pathCoords: number[][]): Array<Stroke> => {
  const pathStrokes = [];
  for (let i = 0; i < pathCoords.length - 1; i++) {
    const [startX, startY] = pathCoords[i];
    const [endX, endY] = pathCoords[i + 1];
    const stroke: Stroke = {
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
  const [start, setStart] = useState<Anchor>();
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);
  const [prevStrokes, setPrevStrokes] = useState<Array<Stroke>>([]);

  const [downsizedWidth, setDownsizedWidth] = useState<number>(0);
  const [factor, setFactor] = useState<number>(1);

  const [canClose, setCanClose] = useState<boolean>(false);

  const [graph, setGraph] = useState<Graph | null>(null);

  const pathFinder = React.useRef<PathFinder<any>>();

  const position = React.useRef<{ x: number; y: number } | null>(null);
  const startPosition = React.useRef<{ x: number; y: number } | null>(null);

  const pathCoordsRef = React.useRef<any>();

  const debouncedPosition = useDebounce(position.current, 20);

  React.useEffect(() => {
    if (graph && img) {
      pathFinder.current = createPathFinder(graph, downsizedWidth);
    }
    setFactor(0.25);
  }, [downsizedWidth, graph, img]);

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
      setDownsizedWidth(img.width * factor);
      const downsized = edges.resize({ factor: factor });
      setGraph(makeGraph(downsized.data, downsized.height, downsized.width));
    };
    loadImg();
  }, [image.src, factor]);

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
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };
          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
        } else {
          setAnnotating(true);
          startPosition.current = position.current;
          if (strokes.length > 0) {
            setAnchor(position.current);
            setPrevStrokes([...prevStrokes, ...strokes]);
          } else {
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
        // let startPosition;
        if (
          pathFinder &&
          pathFinder.current &&
          img &&
          startPosition &&
          startPosition.current
        ) {
          const foundPath = pathFinder.current.find(
            getIdx(downsizedWidth, 1)(
              Math.floor(startPosition.current.x * factor),
              Math.floor(startPosition.current.y * factor),
              0
            ),
            getIdx(downsizedWidth, 1)(
              Math.floor(position.current.x * factor),
              Math.floor(position.current.y * factor),
              0
            )
          );
          pathCoordsRef.current = convertPathToCoords(
            foundPath,
            downsizedWidth,
            factor
          );
          setStrokes(convertCoordsToStrokes(pathCoordsRef.current));
        }
      }
    }
  };

  const onMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      position.current = stage.current.getPointerPosition();

      if (position && position.current) {
        if (connected(position.current)) {
          if (start) {
            const stroke = {
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
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };
          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
          setStrokes([]);
        } else {
          if (strokes.length > 0) {
            setAnchor(position.current);
            startPosition.current = position.current;
            setPrevStrokes([...prevStrokes, ...strokes]);
          } else {
            setStart(position.current);
          }
        }
      }
    }
  };

  useEffect(
    () => {
      if (debouncedPosition && annotating) {
        onMouseMove();
      }
    },
    [annotating, debouncedPosition, onMouseMove] // Only call effect if debounced search term changes
  );

  const Anchor = () => {
    if (anchor) {
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
    if (start) {
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

        {!annotated &&
          annotating &&
          prevStrokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts key={key} stroke={stroke} />
          ))}

        <Anchor />

        {annotation && annotated && !annotating && (
          <MarchingAnts stroke={annotation} />
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
