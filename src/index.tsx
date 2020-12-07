import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { productionStore } from "./store/stores";
import { Application } from "./components/Application";

// const callback = (delta: number): void => {
//   setCount((previous) => {
//     return (previous + delta * 0.01) % 100;
//   });
// };

// const useAnimationFrame = (callback: (delta: number) => void) => {
//   const ref = useRef<number>();
//
//   const previous = useRef<number>();
//
//   const animate = (time: number) => {
//     if (previous && previous.current) {
//       const delta = time - previous.current;
//
//       callback(delta);
//     }
//
//     previous.current = time;
//
//     ref.current = requestAnimationFrame(animate);
//   };
//
//   useEffect(() => {
//     ref.current = requestAnimationFrame(animate);
//
//     return () => cancelAnimationFrame(ref.current!);
//   });
// };
//
// export const Counter = () => {
//   const [count, setCount] = React.useState(0);
//
//   const callback = (delta: number): void => {
//     setCount((previous) => {
//       return (previous + delta * 0.01) % 100;
//     });
//   };
//
//   useAnimationFrame();
//
//   return <div>{Math.round(count)}</div>;
// };

// const useAnimationFrame = (callback: (delta: number) => void) => {
//   const ref = useRef<number>();
//
//   const previous = useRef<number>();
//
//   const animate = (time: number) => {
//     if (previous && previous.current) {
//       const delta = time - previous.current;
//
//       callback(delta);
//     }
//
//     previous.current = time;
//
//     ref.current = requestAnimationFrame(animate);
//   };
//
//   useEffect(() => {
//     ref.current = requestAnimationFrame(animate);
//
//     return () => cancelAnimationFrame(ref.current!);
//   });
// };

const Canvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  const [refresh, setRefresh] = useState<boolean>();
  const [rectangles, setRectangles] = useState<Array<Rectangle>>();

  let mouse: {
    x: number;
    y: number;
  };

  const open = (src: string) => {
    const image = new Image();

    image.src = src;

    image.onload = () => {
      setRefresh(true);
    };

    return image;
  };

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

  let rectangle = new Rectangle(0, 0, 0, 0);

  const useAnimationFrame = () => {
    const animationRef = useRef<number>();

    const animate = () => {
      if (mouse) {
        rectangle.update(mouse);
      }
      rectangle.translate();
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
      rectangle = new Rectangle(x0, y0, x0, y0);
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
      }
    }
  };

  useEffect(() => {
    if (ref && ref.current) {
      const context = ref.current.getContext("2d");

      const image = open("https://www.w3schools.com/css/img_fjords.jpg");

      if (context) {
        context.drawImage(
          image,
          0,
          0,
          context.canvas.width,
          context.canvas.height
        );
      }
    }
  });

  return (
    <canvas
      height={500}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      ref={ref}
      width={800}
    />
  );
};

export const App = () => {
  //return <Counter />;
  return <Canvas />;
};

ReactDOM.render(
  // <Provider store={productionStore}>
  //   <Application />
  // </Provider>,
  <App />,
  document.getElementById("root")
);

serviceWorker.register();
