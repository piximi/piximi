import React, { useEffect, useRef, useState } from "react";

type clickData = {
  x: number;
  y: number;
  dragging: boolean;
};

type ImageCanvasProps = {
  imageIds: Array<string>;
};

export const SimpleImageCanvas = ({ imageIds }: ImageCanvasProps) => {
  const [clicks, setClick] = useState<Array<clickData>>([]);
  const [paint, setPaint] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clearCanvas = (ctx: CanvasRenderingContext2D) => {
    setClick([]);
    ctx.clearRect(0, 0, 300, 300);
  };

  const redraw = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    clicks.forEach((click, index) => {
      clicks[index].dragging
        ? ctx.moveTo(clicks[index - 1].x, clicks[index - 1].y)
        : ctx.moveTo(clicks[index].x, clicks[index].y);
      ctx.lineTo(clicks[index].x, clicks[index].y);
      ctx.stroke();
    });
    ctx.closePath();
  };

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (canvasRef.current) {
      const clickX = event.pageX - canvasRef.current.offsetLeft;
      const clickY = event.pageY - canvasRef.current.offsetTop;
      const newClick = { x: clickX, y: clickY, dragging: false };
      setClick([...clicks, newClick]);
      const context = canvasRef.current.getContext("2d");
      if (context) {
        redraw(context);
      }
    }
    setPaint(true);
  };

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (canvasRef.current) {
      const clickX = event.pageX - canvasRef.current.offsetLeft;
      const clickY = event.pageY - canvasRef.current.offsetTop;
      if (paint) {
        const newClick = { x: clickX, y: clickY, dragging: true };
        setClick([...clicks, newClick]);
        const context = canvasRef.current.getContext("2d");
        if (context) {
          redraw(context);
        }
      }
    }
    event.preventDefault();
  };

  const onMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setPaint(false);
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      redraw(context);
    }
  };

  const onMouseOut = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setPaint(false);
  };

  return (
    <canvas
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseOut={onMouseOut}
      ref={canvasRef}
      id={"myCanvas"}
      width={300}
      height={300}
    />
  );
};
