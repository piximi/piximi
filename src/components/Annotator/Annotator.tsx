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
import { Image as ImageType } from "../../types/Image";
import { useKeyPress } from "../../hooks";
import { Point } from "victory";
import { current } from "@reduxjs/toolkit";

/**
 * useKeyPress
 * @param {string} key - the name of the key to respond to, compared against event.key
 * @param {function} action - the action to perform on key press
 */
export const useKeypress = (key: string, action: () => void) => {
  useEffect(() => {
    function onKeyup(e: any) {
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, [action, key]);
};

const FrameContext = createContext<number>(0);

type Point = {
  x: number;
  y: number;
};

type RenderingContextContextProps = {
  context: CanvasRenderingContext2D;
  current: Point;
  end: Point;
  ended: boolean;
  moving: boolean;
  selected: boolean;
  selecting: boolean;
  start: Point;
  started: boolean;
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
  const [selected, setSelected] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [moving, setMoving] = useState<boolean>(false);
  const [ended, setEnded] = useState<boolean>(false);

  useKeypress("Escape", () => {
    setSelecting(false);

    setSelected(false);
  });

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
    if (!selecting && !selected) {
      setStarted(true);
      setSelecting(true);

      if (ref && ref.current) {
        const boundingClientRect = ref.current.getBoundingClientRect();

        const position = {
          x: event.clientX - boundingClientRect.left,
          y: event.clientY - boundingClientRect.top,
        };

        setStart(position);
      }
    }
  };

  const [current, setCurrent] = useState<Point>({ x: 0, y: 0 });

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    // Tests whether the primary button is depressed
    if (event.buttons === 1) {
      setMoving(true);

      if (ref && ref.current) {
        const boundingClientRect = ref.current.getBoundingClientRect();

        const position = {
          x: event.clientX - boundingClientRect.left,
          y: event.clientY - boundingClientRect.top,
        };

        setCurrent(position);
      }
    }
  };

  const [end, setEnd] = useState<Point>({ x: 0, y: 0 });

  const onMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (selecting) {
      setMoving(!moving);

      if (ref && ref.current) {
        const boundingClientRect = ref.current.getBoundingClientRect();

        const position = {
          x: event.clientX - boundingClientRect.left,
          y: event.clientY - boundingClientRect.top,
        };

        setEnd(position);
      }

      setSelecting(false);
      setMoving(false);
      setSelected(true);
      setStarted(!started);
    }
  };

  if (context) {
    context.clearRect(0, 0, width, height);
  }

  const style = { width, height };

  return (
    <RenderingContextContext.Provider
      value={{
        context: context!,
        current: current,
        end: end,
        ended: ended,
        moving: moving,
        selected: selected,
        selecting: selecting,
        start: start,
        started: started,
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

export const useAnimation = (
  initialValue: any,
  callback: (arg0: any) => void
) => {
  const ref = useRef(initialValue);

  ref.current = callback(ref.current);

  return ref.current;
};

export const useRenderingContext = () => {
  useContext(FrameContext);

  const context = useContext(RenderingContextContext);

  return context!;
};

type BackgroundImageProps = {
  image: ImageType;
};

const BackgroundImage = ({ image }: BackgroundImageProps) => {
  const { context } = useRenderingContext();

  if (context) {
    const img = new Image();

    img.src = image.src;

    img.onload = () => {};

    context.drawImage(img, 0, 0, image.shape!.c, image.shape!.r);
  }

  return null;
};

const EllipticalSelect = () => {
  const {
    context,
    current,
    moving,
    selected,
    selecting,
    start,
  } = useRenderingContext();

  const animation = ({ current, start }: { current: Point; start: Point }) => {
    return {
      center: {
        x: (current.x - start.x) / 2 + start.x,
        y: (current.y - start.y) / 2 + start.y,
      },
      radiusX: Math.abs((current.x - start.x) / 2),
      radiusY: Math.abs((current.y - start.y) / 2),
    };
  };

  const animated = useAnimation({}, () => animation({ current, start }));

  if (context) {
    context.beginPath();

    if (animated) {
      if (selecting && moving && !selected) {
        context.strokeStyle = "white";
        context.setLineDash([10, 10]);
        context.ellipse(
          animated.center.x,
          animated.center.y,
          animated.radiusX,
          animated.radiusY,
          0,
          0,
          2 * Math.PI
        );
        context.stroke();

        context.strokeStyle = "black";
        context.setLineDash([5, 5]);
        context.ellipse(
          animated.center.x,
          animated.center.y,
          animated.radiusX,
          animated.radiusY,
          0,
          0,
          2 * Math.PI
        );
        context.stroke();
      }

      if (selected) {
        context.strokeStyle = "white";
        context.setLineDash([10, 10]);
        context.ellipse(
          animated.center.x,
          animated.center.y,
          animated.radiusX,
          animated.radiusY,
          0,
          0,
          2 * Math.PI
        );
        context.stroke();

        context.strokeStyle = "black";
        context.setLineDash([5, 5]);
        context.ellipse(
          animated.center.x,
          animated.center.y,
          animated.radiusX,
          animated.radiusY,
          0,
          0,
          2 * Math.PI
        );
        context.stroke();
      }
    }
  }

  return null;
};

const RectangularSelect = () => {
  const {
    context,
    current,
    moving,
    selected,
    selecting,
    start,
  } = useRenderingContext();

  const animation = ({ current, start }: { current: Point; start: Point }) => {
    return {
      width: current.x - start.x,
      height: current.y - start.y,
    };
  };

  const animated = useAnimation({}, () => animation({ current, start }));

  if (context) {
    context.beginPath();

    if (animated) {
      if (selecting && !selected && moving) {
        context.strokeStyle = "white";
        context.setLineDash([10, 10]);
        context.strokeRect(start.x, start.y, animated.width, animated.height);

        context.strokeStyle = "black";
        context.setLineDash([5, 5]);
        context.strokeRect(start.x, start.y, animated.width, animated.height);
      }

      if (selected) {
        context.strokeStyle = "white";
        context.setLineDash([10, 10]);
        context.strokeRect(start.x, start.y, animated.width, animated.height);

        context.strokeStyle = "black";
        context.setLineDash([5, 5]);
        context.strokeRect(start.x, start.y, animated.width, animated.height);
      }
    }

    context.fill();
  }

  return null;
};

type AnnotatorProps = {
  image: ImageType;
};

export const Annotator = ({ image }: AnnotatorProps) => {
  return (
    <Canvas animate height={image.shape?.r!} width={image.shape?.c!}>
      <BackgroundImage image={image} />
      {/*<RectangularSelect />*/}
      <EllipticalSelect />
    </Canvas>
  );
};
