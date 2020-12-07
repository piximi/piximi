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

type RenderingContextContextProps = {
  context: CanvasRenderingContext2D;
  end?: Point;
  start?: Point;
};

const RenderingContextContext = createContext<RenderingContextContextProps | null>(
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
    if (context) context.clearRect(0, 0, width, height);

    if (ref && ref.current) {
      const boundingClientRect = ref.current.getBoundingClientRect();

      const position = {
        x: event.clientX - boundingClientRect.left,
        y: event.clientY - boundingClientRect.top,
      };

      setStart(position);
    }
  };

  const [end, setEnd] = useState<Point | null>();

  const onEnd = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (ref && ref.current) {
      const boundingClientRect = ref.current.getBoundingClientRect();

      const position = {
        x: event.clientX - boundingClientRect.left,
        y: event.clientY - boundingClientRect.top,
      };

      setEnd(position);
    }
  };

  if (context) context.clearRect(0, 0, width, height);

  const style = { width, height };

  return (
    <RenderingContextContext.Provider
      value={{ context: context!, end: end!, start: start! }}
    >
      <FrameContext.Provider value={frame}>
        <canvas
          height={height}
          onMouseDown={onStart}
          onMouseUp={onEnd}
          ref={ref}
          style={style}
          width={width}
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

  return context!;
};

type HexagonProps = {
  size: number;
  color: string;
  rotation: number;
  speed: number;
};

const Hexagon = ({ size, color, rotation, speed }: HexagonProps) => {
  const animation = useAnimation(rotation, (angle) => angle + speed);

  const { context, end, start } = useRenderingContext()!;

  if (context) {
    context.beginPath();

    if (start && end) {
      const edgeLength = end.x * 0.5;

      [30, 90, 150, 210, 270, 330].forEach((angle, index) => {
        const radAngle = ((angle + animation) * Math.PI) / 180;
        const point = {
          x: start.x + edgeLength + edgeLength * Math.cos(radAngle),
          y: start.y + edgeLength + edgeLength * Math.sin(radAngle),
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
  }

  return null;
};

export const Annotator = () => {
  return (
    <Canvas animate height={256} width={256}>
      <Hexagon size={128} color="#CCCCCC" rotation={0.5} speed={0.5} />
    </Canvas>
  );
};
