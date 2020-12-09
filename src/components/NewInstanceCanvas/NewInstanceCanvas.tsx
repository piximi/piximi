import React, { useEffect, useRef, useState } from "react";
import { Image as ImageType } from "../../types/Image";
import { useAnimationFrame } from "../../hooks/useAnimationFrame/useAnimationFrame";
import { Rectangle } from "../../image/rectangle";

type Position = {
  x: number;
  y: number;
};

type clickData = {
  x: number;
  y: number;
  dragging: boolean;
};

type NewInstanceCanvasProps = {
  image: ImageType;
};

export const NewInstanceCanvas = ({ image }: NewInstanceCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  const [refresh, setRefresh] = useState<boolean>();
  const [rectangles, setRectangles] = useState<Array<Rectangle>>([]);
  const rectangleRef = useRef<Rectangle>();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState<boolean>(false);

  const open = (src: string) => {
    const image = new Image();

    image.src = src;

    image.onload = () => {
      setRefresh(true);
    };

    return image;
  };

  const animate = () => {
    if (drawing) {
      if (rectangleRef && rectangleRef.current) {
        rectangleRef.current.update(position);
      }

      if (ref && ref.current) {
        const ctx = ref.current.getContext("2d");

        if (ctx && rectangleRef && rectangleRef.current) {
          rectangleRef.current.draw(ctx);
        }
      }
    }
  };

  useAnimationFrame(animate);

  const draw = (context: CanvasRenderingContext2D) => {
    context.lineWidth = 1;
    context.strokeStyle = "blue";

    rectangles?.forEach((rectangle: Rectangle) => {
      rectangle.draw(context);
    });

    context.strokeStyle = "green";
  };

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (ref && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x0 = event.clientX - rect.left;
      const y0 = event.clientY - rect.top;
      rectangleRef.current = new Rectangle(x0, y0, x0 + 1, y0 + 1);
    }

    setDrawing(true);
  };

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (ref && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const onMouseUp = () => {
    setDrawing(false);
    if (rectangles && rectangleRef && rectangleRef.current) {
      setRectangles([...rectangles, rectangleRef.current]);
    }
  };

  useEffect(() => {
    if (drawing) {
      if (rectangleRef && rectangleRef.current) {
        rectangleRef.current.x1 = position.x;
        rectangleRef.current.y1 = position.y;
      }
    }
  });

  useEffect(() => {
    if (ref && ref.current) {
      const context = ref.current.getContext("2d");

      const img = open(image.src);

      if (context) {
        context.drawImage(img, 0, 0, image.shape!.c, image.shape!.r);

        draw(context);
      }
    }
  });

  return (
    <canvas
      height={image.shape?.r}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      ref={ref}
      width={image.shape?.c}
    />
  );
};
