import {
  Box,
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import React from "react";
import * as THREE from "three";
import { Canvas } from "react-three-fiber";
import { Image } from "../../types/Image";

type ImageCanvasProps = {
  image: Image;
};

export const SimpleImageCanvas = ({ image }: ImageCanvasProps) => {
  return <canvas width={300} height={300} />;
};
