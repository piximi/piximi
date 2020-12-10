import React, { useEffect, useRef, useState } from "react";
import LazyPoint from "./LazyPoint";
import Catenary from "./Catenary";
import LazyBrush from "./LazyBrush";

type QuickSelectCanvasProps = {};

export const QuickSelectCanvas = ({}: QuickSelectCanvasProps) => {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const [context, setContext] = useState<CanvasRenderingContext2D | null>();
  const [catenary, setCatenary] = useState<Catenary>(new Catenary());
  const [points, setPoints] = useState<Array<LazyPoint>>([]);
  const [lines, setLines] = useState<Array<any>>([]);
  const [moved, setMoved] = useState<boolean>(true);
  const [valuesChanged, setValuesChanged] = useState<boolean>(true);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [pressing, setPressing] = useState<boolean>(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (canvas && canvas.current) {
      const context = canvas.current.getContext("2d");

      setContext(context);

      const pen = new LazyBrush({
        radius: 12 * window.devicePixelRatio,
        enabled: true,
        initialPoint: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
      });

      const chainLength = 12 * window.devicePixelRatio;

      drawImage();

      loop();

      window.setTimeout(() => {
        const initX = window.innerWidth / 2;
        const initY = window.innerHeight / 2;

        const a = new LazyPoint(initX - chainLength / 4, initY);
        const b = new LazyPoint(initX + chainLength / 4, initY);

        pen.update(a, { both: true });
        pen.update(b, { both: false });

        setMoved(true);

        setValuesChanged(true);

        clear();
      }, 100);
    }
  }, [canvas]);

  const loop = () => {};
  const drawImage = () => {};
  const clear = () => {};

  const onStart = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {};

  const getPointerPosition = (
    event:
      | React.MouseEvent<HTMLCanvasElement, React.MouseEvent>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (
      event.nativeEvent! instanceof MouseEvent ||
      event.nativeEvent! instanceof TouchEvent
    )
      return;

    if (canvas && canvas.current) {
      const boundingClientRect = canvas.current.getBoundingClientRect();

      let clientX;
      let clientY;

      if (event.nativeEvent instanceof MouseEvent) {
        clientX = (event as React.MouseEvent<
          HTMLCanvasElement,
          React.MouseEvent
        >).clientX;
        clientY = (event as React.MouseEvent<
          HTMLCanvasElement,
          React.MouseEvent
        >).clientY;
      } else {
        clientX = (event as React.TouchEvent<HTMLCanvasElement>)
          .changedTouches[0].clientX;
        clientY = (event as React.TouchEvent<HTMLCanvasElement>)
          .changedTouches[0].clientY;
      }

      return {
        x: clientX - boundingClientRect.left,
        y: clientY - boundingClientRect.top,
      };
    }
  };

  return <canvas ref={canvas} />;
};
