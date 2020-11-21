import React, { useRef, useState } from "react";
import { useStyles } from "../Application/Application.css";
import { useSelector } from "react-redux";
import { imagesSelector } from "../../store/selectors";
import { Image as ImageType } from "../../types/Image";

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
  const [click, setNewClick] = useState<clickData>({
    x: 0,
    y: 0,
    dragging: false,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedImages: Array<ImageType> = useSelector(imagesSelector);

  React.useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const background = new Image();
      background.src = selectedImages[0].src;
      background.onload = () => {
        if (context) {
          context.drawImage(background, 0, 0);
        }
      };
    }
  }, []);

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
      if (context && brush) {
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
        if (box) {
          context.rect(clickX, clickY, 50, 50);
          context.fill();
        } else {
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
    <div>
      <div className={classes.imageCanvasContainer}>
        <canvas
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseOut={onMouseOut}
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
