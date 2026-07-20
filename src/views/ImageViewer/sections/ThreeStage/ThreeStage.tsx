import { useEffect, useRef, useState } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";

import { Box } from "@mui/material";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { selectExtendedImageById } from "store/dataV2/selectors";
import { useParameterizedSelector } from "store/hooks";

import { useThreeChannelRenderer } from "./useThreeChannelRenderer";
import { useThreePanZoom } from "./useThreePanZoom";
import { ActiveImageInfoStrip } from "./ActiveImageInfoStrip";

type ThreeStageProps = {
  stageWidth: number;
  stageHeight: number;
};

export const ThreeStage = ({ stageWidth, stageHeight }: ThreeStageProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const imageCamRef = useRef<THREE.OrthographicCamera | null>(null); // fixed camera for readback
  const sceneRef = useRef<THREE.Scene | null>(null);
  const imageTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const [absolutePosition, setAbsolutePosition] = useState<
    { x: number; y: number } | undefined
  >();
  const [outOfBounds, setOutOfBounds] = useState(true);

  const activeImageId = useSelector(selectActiveImageId);
  const image = useParameterizedSelector(
    selectExtendedImageById,
    activeImageId ?? "",
  );
  const imageWidth = image?.shape.width ?? 1;
  const imageHeight = image?.shape.height ?? 1;

  // --- Init renderer, scene, cameras (once) ---
  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(stageWidth, stageHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Viewport camera — driven by pan/zoom interactions
    const camera = new THREE.OrthographicCamera(
      -stageWidth / 2,
      stageWidth / 2,
      stageHeight / 2,
      -stageHeight / 2,
      0.1,
      10,
    );
    camera.position.z = 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // --- Resize viewport camera when stage dimensions change ---
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!renderer || !camera || !scene) return;
    renderer.setSize(stageWidth, stageHeight);
    camera.left = -stageWidth / 2;
    camera.right = stageWidth / 2;
    camera.top = stageHeight / 2;
    camera.bottom = -stageHeight / 2;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }, [stageWidth, stageHeight]);

  // --- Image-sized camera + render target for IJSImage readback ---
  useEffect(() => {
    imageTargetRef.current?.dispose();
    imageTargetRef.current = new THREE.WebGLRenderTarget(
      imageWidth,
      imageHeight,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      },
    );

    // Fixed orthographic camera that always frames the image exactly
    imageCamRef.current = new THREE.OrthographicCamera(
      -imageWidth / 2,
      imageWidth / 2,
      imageHeight / 2,
      -imageHeight / 2,
      0.1,
      10,
    );
    imageCamRef.current.position.z = 1;

    return () => {
      imageTargetRef.current?.dispose();
    };
  }, [imageWidth, imageHeight]);

  // --- Reset viewport camera when active image changes ---
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.set(0, 0, 1);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }, [activeImageId]);

  useEffect(() => {
    const el = mountRef.current;
    const onMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) return;
      const camera = cameraRef.current;
      if (!camera || !el) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Mouse → world space (orthographic camera)
      const worldX =
        camera.position.x + (mouseX - stageWidth / 2) / camera.zoom;
      const worldY =
        camera.position.y - (mouseY - stageHeight / 2) / camera.zoom;

      // World → image pixel (plane centered at origin, Y flipped)
      const imgX = worldX + imageWidth / 2;
      const imgY = imageHeight / 2 - worldY;

      const oob =
        imgX < 0 || imgX >= imageWidth || imgY < 0 || imgY >= imageHeight;
      setOutOfBounds(oob);
      setAbsolutePosition({
        x: Math.round(Math.max(0, Math.min(imageWidth - 1, imgX))),
        y: Math.round(Math.max(0, Math.min(imageHeight - 1, imgY))),
      });
    };

    el?.addEventListener("mousemove", onMouseMove);
    return () => el?.removeEventListener("mousemove", onMouseMove);
  }, [stageWidth, stageHeight, imageWidth, imageHeight]);

  // --- Channel rendering (uniforms + DataArrayTexture) ---
  useThreeChannelRenderer(
    sceneRef,
    rendererRef,
    cameraRef,
    imageCamRef,
    imageTargetRef,
    imageWidth,
    imageHeight,
  );
  // --- Pan / zoom ---
  const { isPanningRef } = useThreePanZoom(
    mountRef,
    cameraRef,
    rendererRef,
    sceneRef,
  );

  return (
    <Box sx={{ zIndex: 999 }}>
      <Box ref={mountRef} sx={{ width: stageWidth, height: stageHeight }} />
      {image && (
        <ActiveImageInfoStrip
          absolutePosition={absolutePosition}
          image={image}
          width={stageWidth}
          show={!outOfBounds}
        />
      )}
    </Box>
  );
};
