import React, { useEffect, useRef, useState } from "react";
import { Image as ImageType } from "../../types/Image";
import { Rect } from "victory";

class Rectangle {
  public render: boolean = false;

  public x0: number;
  public y0: number;
  public x1: number;
  public y1: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.x = Math.min(x0, x1);
    this.y = Math.min(y0, y1);
    this.width = Math.max(x0, x1) - Math.min(x0, x1);
    this.height = Math.max(y0, y1) - Math.min(y0, y1);
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.render) {
      context.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  reset(point: { x: number; y: number }) {
    this.x0 = point.x;
    this.x1 = point.x;
    this.y0 = point.y;
    this.y1 = point.y;

    this.translate();

    this.render = true;
  }

  translate() {
    this.x = Math.min(this.x0, this.x1);
    this.y = Math.min(this.y0, this.y1);
    this.width = Math.max(this.x0, this.x1) - Math.min(this.x0, this.x1);
    this.height = Math.max(this.y0, this.y1) - Math.min(this.y0, this.y1);
  }

  update(point: { x: number; y: number }) {
    this.x1 = point.x;
    this.y1 = point.y;

    this.translate();

    this.render = true;
  }
}

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

  document.onmousedown = () => {};

  const [refresh, setRefresh] = useState<boolean>();
  const [rectangles, setRectangles] = useState<Array<Rectangle>>();
  const [rectangle, setRectangle] = useState<Rectangle>(
    new Rectangle(0, 0, 1, 1)
  );

  const mouse = {
    x: 0,
    y: 0,
  };

  const open = (src: string) => {
    const image = new Image();

    image.src = src;

    image.onload = () => {
      setRefresh(true);
    };

    return image;
  };

  const useAnimationFrame = () => {
    const animationRef = useRef<number>();
    const animate = () => {
      if (mouse) {
        rectangle.update(mouse);
      }
      if (ref && ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) {
          rectangle.draw(ctx);
        }
      }
    };

    useEffect(() => {
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current!);
    });
  };

  useAnimationFrame();

  const draw = (context: CanvasRenderingContext2D, src: string) => {
    const image = open(src);

    context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);

    context.lineWidth = 1;
    context.strokeStyle = "red";

    rectangles?.forEach((rectangle: Rectangle) => {
      rectangle.draw(context);
    });

    context.strokeStyle = "green";
  };

  const pointer = {
    element: null,
    event: (e: MouseEvent) => {},
  };

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (ref && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x0 = event.clientX - rect.left;
      const y0 = event.clientY - rect.top;
      setRectangle(new Rectangle(x0, y0, x0 + 1, y0 + 1));
    }
  };

  const onMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (ref && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (mouse) {
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        setRectangle(
          (prevRectangle) =>
            new Rectangle(prevRectangle.x0, prevRectangle.y0, mouse.x, mouse.y)
        );
      }
    }
  };

  useEffect(() => {
    if (ref && ref.current) {
      const context = ref.current.getContext("2d");

      const img = open(image.src);

      if (context) {
        context.drawImage(img, 0, 0, image.shape!.c, image.shape!.r);
      }
    }
  });

  return (
    <canvas
      height={image.shape?.r}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      ref={ref}
      width={image.shape?.c}
    />
  );
};
