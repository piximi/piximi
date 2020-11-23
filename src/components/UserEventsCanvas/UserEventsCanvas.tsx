import React, { useRef, useState } from "react";
import { SelectionMethod } from "../../types/SelectionMethod";
import { useSelector } from "react-redux";
import { selectionMethodSelector } from "../../store/selectors/selectionMethodSelector";
import { useStyles } from "../ImageDialogCanvas/ImageDialogCanvas.css";

type clickData = {
  x: number;
  y: number;
  dragging: boolean;
};

export const UserEventsCanvas = () => {
  const classes = useStyles();
  const selectionMethod = useSelector(selectionMethodSelector);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [click, setNewClick] = useState<clickData>({
    x: 0,
    y: 0,
    dragging: false,
  });

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
    if (click.dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const context = canvasRef.current.getContext("2d");
      if (context && selectionMethod === SelectionMethod.Quick) {
        drawLine(context, click.x, click.y, clickX, clickY);
        setNewClick({ x: clickX, y: clickY, dragging: true });
      }
      event.preventDefault();
    }
  };

  const onMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (click.dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const context = canvasRef.current.getContext("2d");
      if (context) {
        if (selectionMethod === SelectionMethod.RectangularMarquee) {
          context.rect(clickX, clickY, 50, 50);
          context.fill();
          ////add instance to store
          //createImageBitmap(canvasRef.current).then()
        } else if (selectionMethod === SelectionMethod.Quick) {
          drawLine(context, click.x, click.y, clickX, clickY);
        }
        setNewClick({ x: 0, y: 0, dragging: false });
      }
    }
  };

  const onMouseOut = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setNewClick({ x: 0, y: 0, dragging: false });
  };

  return (
    <canvas
      className={classes.userEventsCanvas}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseOut={onMouseOut}
      ref={canvasRef}
      id={"myCanvas"}
      style={{ border: "1px solid blue" }}
    />
  );
};
