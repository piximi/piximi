import React, { useEffect, useRef, useState } from "react";
import LazyPoint from "./LazyPoint";
import Catenary from "./Catenary";
import LazyBrush from "./LazyBrush";
import { drawImage } from "./drawImage";
import { Image as ImageType } from "../../types/Image";

type QuickSelectCanvasProps = {
  image: ImageType;
};

function midpoint(p1: LazyPoint, p2: LazyPoint) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
}

export const QuickSelectCanvas = ({ image }: QuickSelectCanvasProps) => {
  const interfaceCanvas = useRef<HTMLCanvasElement | null>(null);
  const selectionCanvas = useRef<HTMLCanvasElement | null>(null);
  const temporaryCanvas = useRef<HTMLCanvasElement | null>(null);
  const imageCanvas = useRef<HTMLCanvasElement | null>(null);

  const [
    interfaceContext,
    setInterfaceContext,
  ] = useState<CanvasRenderingContext2D | null>();
  const [
    selectionContext,
    setSelectionContext,
  ] = useState<CanvasRenderingContext2D | null>();
  const [
    temporaryContext,
    setTemporaryContext,
  ] = useState<CanvasRenderingContext2D | null>();
  const [
    imageContext,
    setImageContext,
  ] = useState<CanvasRenderingContext2D | null>();

  const [radius, setRadius] = useState<number>(12);
  const [catenary, setCatenary] = useState<Catenary>(new Catenary());
  const [points, setPoints] = useState<Array<LazyPoint>>([]);
  const [lines, setLines] = useState<Array<any>>([]);
  const [moved, setMoved] = useState<boolean>(true);
  const [valuesChanged, setValuesChanged] = useState<boolean>(true);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [pressing, setPressing] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>("#444");
  const [brushRadius, setBrushRadius] = useState<number>(10);
  const [catenaryColor, setCatenaryColor] = useState<string>("#0a0302");
  const [chainLength, setChainLength] = useState<number>(
    radius * window.devicePixelRatio
  );

  const origin = new LazyPoint(window.innerWidth / 2, window.innerHeight / 2);

  const pen = new LazyBrush({
    radius: radius * window.devicePixelRatio,
    initialPoint: origin,
  });

  const [selector, setSelector] = useState<LazyBrush>(pen);

  useEffect(() => {
    const clear = () => {
      setLines([]);

      setValuesChanged(true);

      if (selectionCanvas && selectionCanvas.current && selectionContext) {
        selectionContext.clearRect(
          0,
          0,
          selectionCanvas.current.width,
          selectionCanvas.current.height
        );
      }

      if (temporaryCanvas && temporaryCanvas.current && temporaryContext) {
        temporaryContext.clearRect(
          0,
          0,
          temporaryCanvas.current.width,
          temporaryCanvas.current.height
        );
      }
    };

    const loop = ({ once = false } = {}) => {
      if (moved || valuesChanged) {
        const pointer = selector.getPointerCoordinates();
        const brush = selector.getBrushCoordinates();

        if (interfaceContext) {
          interfaceContext.clearRect(
            0,
            0,
            interfaceContext.canvas.width,
            interfaceContext.canvas.height
          );

          // Draw brush preview
          interfaceContext.beginPath();
          interfaceContext.fillStyle = brushColor;
          interfaceContext.arc(
            new LazyPoint(brush.x, brush.y).x,
            new LazyPoint(brush.x, brush.y).y,
            brushRadius,
            0,
            Math.PI * 2,
            true
          );
          interfaceContext.fill();

          // Draw mouse point (the one directly at the cursor)
          interfaceContext.beginPath();
          interfaceContext.fillStyle = catenaryColor;
          interfaceContext.arc(
            new LazyPoint(pointer.x, pointer.y).x,
            new LazyPoint(pointer.x, pointer.y).y,
            4,
            0,
            Math.PI * 2,
            true
          );
          interfaceContext.fill();

          // Draw catenary
          if (selector.isEnabled()) {
            interfaceContext.beginPath();
            interfaceContext.lineWidth = 2;
            interfaceContext.lineCap = "round";
            interfaceContext.setLineDash([2, 4]);
            interfaceContext.strokeStyle = catenaryColor;
            catenary.drawToCanvas(
              interfaceContext,
              new LazyPoint(brush.x, brush.y),
              new LazyPoint(pointer.x, pointer.y),
              chainLength
            );
            interfaceContext.stroke();
          }

          // Draw brush point (the one in the middle of the brush preview)
          interfaceContext.beginPath();
          interfaceContext.fillStyle = catenaryColor;
          interfaceContext.arc(
            new LazyPoint(brush.x, brush.y).x,
            new LazyPoint(brush.x, brush.y).y,
            2,
            0,
            Math.PI * 2,
            true
          );
          interfaceContext.fill();
        }

        setMoved(false);
        setValuesChanged(false);
      }

      if (!once) {
        window.requestAnimationFrame(() => {
          loop();
        });
      }
    };

    if (interfaceCanvas && interfaceCanvas.current) {
      setInterfaceContext(interfaceCanvas.current.getContext("2d"));
    }

    if (selectionCanvas && selectionCanvas.current) {
      setSelectionContext(selectionCanvas.current.getContext("2d"));
    }

    if (temporaryCanvas && temporaryCanvas.current) {
      setTemporaryContext(temporaryCanvas.current.getContext("2d"));
    }

    if (imageCanvas && imageCanvas.current) {
      setImageContext(imageCanvas.current.getContext("2d"));
    }

    if (!image?.src) return;

    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (imageContext)
        drawImage({
          ctx: imageContext,
          img: img,
          x: 0,
          y: 0,
          w: imageContext.canvas.width,
          h: imageContext.canvas.height,
          offsetX: 0.5,
          offsetY: 0.5,
        });
    };

    img.src = image.src;

    loop();

    window.setTimeout(() => {
      const initX = window.innerWidth / 2;
      const initY = window.innerHeight / 2;

      const a = new LazyPoint(initX - chainLength / 4, initY);
      const b = new LazyPoint(initX + chainLength / 4, initY);

      selector.update(a, { both: true });
      selector.update(b, { both: false });

      setMoved(true);

      setValuesChanged(true);

      clear();
    }, 100);
  }, [
    brushColor,
    brushRadius,
    catenary,
    catenaryColor,
    chainLength,
    image,
    imageContext,
    interfaceCanvas,
    interfaceContext,
    moved,
    selectionCanvas,
    selectionContext,
    selector,
    temporaryCanvas,
    temporaryContext,
    valuesChanged,
  ]);

  const onMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    setPressing(true);

    const position = getPointerPosition(event);

    if (position) {
      onPointerMove(position.x, position.y);
    }
  };

  const onMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const position = getPointerPosition(event);

    if (position) {
      onPointerMove(position.x, position.y);
    }
  };

  const onMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    onMouseMove(event);

    setDrawing(false);

    setPressing(false);
  };

  const onPointerMove = (x: number, y: number) => {
    selector.update(new LazyPoint(x, y));

    if ((pressing && !drawing) || (!selector.isEnabled() && pressing)) {
      setDrawing(true);

      points.push(selector.brush);
    }

    if (drawing) {
      points.push(selector.brush);

      if (temporaryContext) {
        temporaryContext.lineJoin = "round";
        temporaryContext.lineCap = "round";
        temporaryContext.strokeStyle = brushColor;

        temporaryContext.clearRect(
          0,
          0,
          temporaryContext.canvas.width,
          temporaryContext.canvas.height
        );

        temporaryContext.lineWidth = brushRadius * 2;

        let p1 = points[0];
        let p2 = points[1];

        temporaryContext.moveTo(p2.x, p2.y);
        temporaryContext.beginPath();

        for (let i = 1, len = points.length; i < len; i++) {
          // we pick the point between pi+1 & pi+2 as the
          // end point and p1 as our control point
          const midPoint = midpoint(p1, p2);

          temporaryContext.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);

          p1 = points[i];
          p2 = points[i + 1];
        }

        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        temporaryContext.lineTo(p1.x, p1.y);
        temporaryContext.stroke();
      }
    }

    setMoved(true);
  };

  const getPointerPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (temporaryCanvas && temporaryCanvas.current) {
      const boundingClientRect = temporaryCanvas.current.getBoundingClientRect();

      let clientX = event.clientX;
      let clientY = event.clientY;

      return {
        x: clientX - boundingClientRect.left,
        y: clientY - boundingClientRect.top,
      };
    }
  };

  return (
    <React.Fragment>
      <canvas
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        ref={interfaceCanvas}
        style={{ display: "block", position: "absolute", zIndex: 15 }}
        height={512}
        width={512}
      />

      <canvas
        ref={selectionCanvas}
        style={{ display: "block", position: "absolute", zIndex: 11 }}
        height={512}
        width={512}
      />

      <canvas
        ref={temporaryCanvas}
        style={{ display: "block", position: "absolute", zIndex: 12 }}
        height={512}
        width={512}
      />

      <canvas
        ref={imageCanvas}
        style={{ display: "block", position: "absolute", zIndex: 10 }}
        height={512}
        width={512}
      />
    </React.Fragment>
  );
};
