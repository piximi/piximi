import React, { useRef, useState } from "react";
import { useStyles } from "../Application/Application.css";
import { useSelector } from "react-redux";
import { imagesSelector, selectedImagesSelector } from "../../store/selectors";
import { Image as ImageType } from "../../types/Image";
import { Toolbar } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";

type clickData = {
  x: number;
  y: number;
  dragging: boolean;
};

type ImageCanvasProps = {
  box: boolean;
  brush: boolean;
};

export const SimpleImageCanvas = ({ box, brush }: ImageCanvasProps) => {
  const classes = useStyles();

  const images = useSelector(imagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [click, setNewClick] = useState<clickData>({
    x: 0,
    y: 0,
    dragging: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [counter, setCounter] = React.useState<number>(0);

  const [selectedImage, setSelectedImage] = useState<string>(
    selectedImages[counter]
  );

  const [aspectRatio, setAspectRatio] = React.useState<number>(1);

  React.useEffect(() => {
    const nextImage = selectedImages.find(
      (image) => image === selectedImages[counter]
    );
    if (nextImage) {
      setSelectedImage(nextImage);
    }
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const background = new Image();

      const index = images.findIndex(
        (image: ImageType) => image.id === selectedImage
      );

      background.src = images[index].src;

      background.onload = () => {
        if (context) {
          setAspectRatio(background.height / background.width);
          context.drawImage(background, 0, 0);
        }
      };
    }
  }, [selectedImages, selectedImage, selectedImages, counter]);

  const onNextImage = () => {
    setCounter((prevCounter: number) => {
      return prevCounter === selectedImages.length - 1
        ? selectedImages.length - 1
        : prevCounter + 1;
    });
  };

  const onPreviousImage = () => {
    setCounter((prevCounter: number) => {
      return prevCounter === 0 ? 0 : prevCounter - 1;
    });
  };

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
        } else if (brush) {
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
          width={700}
          height={700 * aspectRatio}
          style={{ border: "1px solid" }}
        />
      </div>
      <div>
        <Toolbar style={{ justifyContent: "center" }}>
          <IconButton color="inherit" onClick={onPreviousImage}>
            <ArrowBackIosIcon />
          </IconButton>
          <IconButton color="inherit" onClick={onNextImage}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Toolbar>
      </div>
    </div>
  );
};
