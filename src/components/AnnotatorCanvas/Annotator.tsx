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
import { current } from "@reduxjs/toolkit";

const FrameContext = createContext<number>(0);

type Point = {
  x: number;
  y: number;
};

type RenderingContextContextProps = {
  context: CanvasRenderingContext2D;
  current: Point;
  end: Point;
  start: Point;
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

  const [start, setStart] = useState<Point>({ x: 0, y: 0 });

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

  const [current, setCurrent] = useState<Point>({ x: 0, y: 0 });

  const onMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (ref && ref.current) {
      const boundingClientRect = ref.current.getBoundingClientRect();

      const position = {
        x: event.clientX - boundingClientRect.left,
        y: event.clientY - boundingClientRect.top,
      };

      setCurrent(position);
    }
  };

  const [end, setEnd] = useState<Point>({ x: 0, y: 0 });

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
      value={{ context: context!, current: current, end: end, start: start }}
    >
      <FrameContext.Provider value={frame}>
        <canvas
          height={height}
          onMouseDown={onStart}
          onMouseUp={onEnd}
          onMouseMove={onMove}
          ref={ref}
          style={style}
          width={width}
        />

        {children}
      </FrameContext.Provider>
    </RenderingContextContext.Provider>
  );
};

const useAnimation = (initialValue: any, callback: (arg0: any) => void) => {
  const ref = useRef(initialValue);
  console.log(ref.current);

  ref.current = callback(ref.current);

  return ref.current;
};

const useRenderingContext = () => {
  useContext(FrameContext);

  const context = useContext(RenderingContextContext);

  return context!;
};

type HexagonProps = {
  color: string;
  rotation: number;
  speed: number;
};

const RectangularSelect = () => {
  const { context, current, end, start } = useRenderingContext();

  const animation = ({ current, start }: { current: Point; start: Point }) => {
    return {
      width: current.x - start.x,
      height: current.y - start.y,
    };
  };

  const animated = useAnimation({}, animation);

  // if (start) {
  //   context.strokeRect(start.x, this.y, this.width, this.height)
  // }

  if (context) {
    context.beginPath();

    // if (start && end && animated) {
    //   context.rect(start.x, start.y, animated.width, animated.height);
    // }

    context.fill();
  }

  return null;
};

const EllipticalSelect = () => {
  const { context } = useRenderingContext();

  if (context) {
    context.beginPath();

    context.rect(0, 0, 100, 100);

    context.fill();
  }

  return null;
};

const Hexagon = ({ color, rotation, speed }: HexagonProps) => {
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

export const Annotator = ({
  rotation,
  speed,
}: {
  rotation: number;
  speed: number;
}) => {
  return (
    <Canvas animate height={256} width={256}>
      {/*<Hexagon color="#CCCCCC" rotation={rotation} speed={speed} />*/}
      <RectangularSelect />
      {/*<EllipticalSelect/>*/}
    </Canvas>
  );
};
