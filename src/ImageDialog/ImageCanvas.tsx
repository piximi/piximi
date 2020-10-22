import { Box, PerspectiveCamera } from "@react-three/drei";
import React from "react";
import * as THREE from "three";
import { Image } from "../store";
import { Canvas } from "react-three-fiber";

type ImageCanvasProps = {
  image: Image;
};

export const ImageCanvas = ({ image }: ImageCanvasProps) => {
  const ref = React.useRef();

  const texture = React.useMemo(() => {
    return new THREE.TextureLoader().load(image.src);
  }, [image]);

  return (
    <Canvas
      colorManagement={false}
      onCreated={({ gl }) => {
        gl.setClearColor("pink");
      }}
    >
      <React.Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 0, 2]} />

        <mesh ref={ref}>
          <Box args={[1, 1, 1]}>
            <meshBasicMaterial attach="material" map={texture} />
          </Box>
        </mesh>
      </React.Suspense>
    </Canvas>
  );
};
