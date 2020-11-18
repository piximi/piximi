import {
  Box,
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "react-three-fiber";
import { Image } from "../../types/Image";

type coordinate = {
  x: number;
  y: number;
};

type ImageCanvasProps = {
  imageIds: Array<string>;
};

export const SimpleImageCanvas = ({ imageIds }: ImageCanvasProps) => {
  const [clicks, setClick] = useState<Array<coordinate>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    console.log("Clicked!");
    const newClick = { x: event.pageX, y: event.pageY };
    setClick([...clicks, newClick]);
    console.log(clicks);
  };

  const onDrag = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    console.log("MOVING");
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(50, 100, 20, 0, 2 * Math.PI);
    ctx.fill();
  };

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      // context.fillStyle = '#000000'
      // context.fillRect(0, 0, context.canvas.width, context.canvas.height)
      //canvasRef.addEventListener("mousedown", onMouseDown)
      draw(context);
    }
  }, [draw]);

  return (
    <canvas
      onDrag={onDrag}
      onMouseDown={onMouseDown}
      ref={canvasRef}
      id={"myCanvas"}
      width={300}
      height={300}
    />
  );
};
