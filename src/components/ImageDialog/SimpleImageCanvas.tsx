import React, { useRef, useState } from "react";
import { useStyles } from "../Application/Application.css";
import { ImageDialogToolboxBar } from "../ImageDialogToolboxBar";

type clickData = {
  x: number;
  y: number;
  dragging: boolean;
};

type ImageCanvasProps = {
  imageIds: Array<string>;
  box: boolean;
  brush: boolean;
};

export const SimpleImageCanvas = ({
  imageIds,
  box,
  brush,
}: ImageCanvasProps) => {
  const classes = useStyles();

  //const [clicks, setClick] = useState<Array<clickData>>([]);
  const [click, setNewClick] = useState<clickData>({
    x: 0,
    y: 0,
    dragging: false,
  });
  //const [paint, setPaint] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawLine = (
    context: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
  };

  // const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  //   setClick([]);
  //   ctx.clearRect(0, 0, 300, 300);
  // };

  // const redraw = (ctx: CanvasRenderingContext2D) => {
  //   ctx.beginPath();
  //   clicks.forEach((click, index) => {
  //     clicks[index].dragging
  //       ? ctx.moveTo(clicks[index - 1].x, clicks[index - 1].y)
  //       : ctx.moveTo(clicks[index].x, clicks[index].y);
  //     ctx.lineTo(clicks[index].x, clicks[index].y);
  //     ctx.stroke();
  //   });
  //   ctx.closePath();
  // };

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      setNewClick({ x: clickX, y: clickY, dragging: true });
    }
  };

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const context = canvasRef.current.getContext("2d");
      if (click.dragging) {
        if (context) {
          drawLine(context, click.x, click.y, clickX, clickY);
        }
        setNewClick({ x: clickX, y: clickY, dragging: true });

        event.preventDefault();
      }
    }
  };

  const onMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (click.dragging) {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const context = canvasRef.current.getContext("2d");
        if (context) {
          drawLine(context, click.x, click.y, clickX, clickY);
        }
      }
      setNewClick({ x: 0, y: 0, dragging: false });
    }
  };

  // const onMouseDown = (
  //   event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  // ) => {
  //   if (canvasRef.current) {
  //     const rect = canvasRef.current.getBoundingClientRect();
  //     const clickX = event.clientX - rect.left;
  //     const clickY = event.clientY - rect.top;
  //     const newClick = { x: clickX, y: clickY, dragging: false };
  //     setClick([...clicks, newClick]);
  //     const context = canvasRef.current.getContext("2d");
  //     if (context) {
  //       redraw(context);
  //     }
  //   }
  //   setPaint(true);
  // };
  //
  // const onMouseMove = (
  //   event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  // ) => {
  //   if (canvasRef.current) {
  //     const rect = canvasRef.current.getBoundingClientRect();
  //     const clickX = event.clientX - rect.left;
  //     const clickY = event.clientY - rect.top;
  //     if (paint) {
  //       const newClick = { x: clickX, y: clickY, dragging: true };
  //       setClick([...clicks, newClick]);
  //       const context = canvasRef.current.getContext("2d");
  //       if (context) {
  //         redraw(context);
  //       }
  //     }
  //   }
  //   event.preventDefault();
  // };

  // const onMouseUp = (
  //   event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  // ) => {
  //   setPaint(false);
  //   const context = canvasRef.current?.getContext("2d");
  //   if (context) {
  //     redraw(context);
  //   }
  // };

  // const onMouseOut = (
  //   event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  // ) => {
  //   setPaint(false);
  // };

  return (
    <div>
      <div className={classes.imageCanvasContainer}>
        <canvas
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          //onMouseOut={onMouseOut}
          ref={canvasRef}
          id={"myCanvas"}
          width={300}
          height={300}
          style={{ border: "1px solid" }}
        />
      </div>
    </div>
  );
};
