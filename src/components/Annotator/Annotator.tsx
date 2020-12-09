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
  current: Point;
  end: Point;
  selecting: boolean;
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
  const ref = useRef<HTMLCanvasElement | null>(null);

  const [selecting, setSelecting] = useState<boolean>(false);

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

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setSelecting(!selecting);

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

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
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

  const onMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (ref && ref.current) {
      const boundingClientRect = ref.current.getBoundingClientRect();

      const position = {
        x: event.clientX - boundingClientRect.left,
        y: event.clientY - boundingClientRect.top,
      };

      setEnd(position);
    }

    setSelecting(!selecting);
  };

  if (context) context.clearRect(0, 0, width, height);

  const style = { width, height };

  return (
    <RenderingContextContext.Provider
      value={{
        context: context!,
        current: current,
        end: end,
        selecting: selecting,
        start: start,
      }}
    >
      <FrameContext.Provider value={frame}>
        <canvas
          height={height}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
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

const RectangularSelect = () => {
  const { context, current, end, selecting, start } = useRenderingContext();

  const animation = ({ current, start }: { current: Point; start: Point }) => {
    return {
      width: current.x - start.x,
      height: current.y - start.y,
    };
  };

  const animated = useAnimation({}, () => animation({ current, start }));

  if (context) {
    context.beginPath();

    context.setLineDash([10, 10]);

    if (
      animated &&
      start.x !== 0 &&
      start.y !== 0 &&
      end.x !== 0 &&
      end.y !== 0
    ) {
      if (selecting) {
        context.strokeRect(start.x, start.y, animated.width, animated.height);
      }
    }

    context.fill();
  }

  return null;
};

export const Annotator = () => {
  return (
    <Canvas animate height={512} width={512}>
      <RectangularSelect />
    </Canvas>
  );
};
