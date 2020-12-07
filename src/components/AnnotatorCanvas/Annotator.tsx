import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import random from "lodash/random";

const FrameContext = createContext<number>(0);

type Point = {
  x: number;
  y: number;
};

const RenderingContextContext = createContext<CanvasRenderingContext2D | null>(
  null
);

type CanvasProps = {
  animate: boolean;
  children: ReactNode;
  height: number;
  width: number;
};

const Canvas = ({ animate, children, height, width }: CanvasProps) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  const [
    context,
    setContext,
  ] = React.useState<CanvasRenderingContext2D | null>();

  useEffect(() => {
    if (ref && ref.current) {
      const context = ref.current.getContext("2d");

      setContext(context);
    }
  }, [ref]);

  const [frame, setFrame] = useState<number>(0);

  useEffect(() => {
    let identifier: number;

    const callback = () => setFrame(frame + 1);

    if (animate) identifier = requestAnimationFrame(callback);

    return () => cancelAnimationFrame(identifier);
  }, [animate, frame, setFrame]);

  useLayoutEffect(() => {
    setFrame(random(1, true));
  }, [width, height]);

  const [start, setStart] = useState<Point | null>();

  const onStart = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (ref && ref.current) {
      const boundingClientRect = ref.current.getBoundingClientRect();

      const position = {
        x: event.clientX - boundingClientRect.left,
        y: event.clientY - boundingClientRect.top,
      };

      setStart(position);
    }
  };

  if (context) context.clearRect(0, 0, width, height);

  const style = { width, height };

  return (
    <RenderingContextContext.Provider value={context!}>
      <FrameContext.Provider value={frame}>
        <canvas
          height={height}
          ref={ref}
          style={style}
          width={width}
          onMouseDown={onStart}
        />

        {children}
      </FrameContext.Provider>
    </RenderingContextContext.Provider>
  );
};

const useAnimation = (initialValue: any, callback: (current: any) => void) => {
  const ref = useRef(initialValue);

  ref.current = callback(ref.current);

  return ref.current;
};

const useRenderingContext = () => {
  useContext(FrameContext);

  const context = useContext(RenderingContextContext);

  return context;
};

type HexagonProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speed: number;
};

const Hexagon = ({ x, y, size, color, rotation, speed }: HexagonProps) => {
  const animation = useAnimation(rotation, (angle) => angle + speed);

  const context = useRenderingContext();

  if (context) {
    const edgeLength = size * 0.5;

    context.beginPath();
    // This article explains all the math behind hexagons
    // https://www.redblobgames.com/grids/hexagons/
    [30, 90, 150, 210, 270, 330].forEach((angle, index) => {
      const radAngle = ((angle + animation) * Math.PI) / 180;
      const point = {
        x: x + edgeLength + edgeLength * Math.cos(radAngle),
        y: y + edgeLength + edgeLength * Math.sin(radAngle),
      };

      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.fillStyle = color;
    context.fill();
  }

  return null;
};

const RectangularSelection = () => {
  const animation = useAnimation(0.5, (x) => x + 1);

  const context = useRenderingContext();

  const select = (x1: number, y1: number, length: number, angle: number) => {
    angle *= Math.PI / 180;

    let x2 = x1 + length * Math.cos(angle);
    let y2 = y1 + length * Math.sin(angle);

    context!.moveTo(x1, y1);

    context!.lineTo(x2, y2);
  };

  if (context) {
    context.beginPath();

    [8, 16, 32, 64, 128, 256].forEach((step) => {
      select(32, 32, 32, step);
    });

    context.stroke();
  }

  return null;
};

export const Annotator = () => {
  return (
    <Canvas animate height={256} width={256}>
      <RectangularSelection />
    </Canvas>
  );
};
