import { useEffect, useMemo, useRef, useState } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";

import { Box } from "@mui/material";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { selectExtendedImageById } from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";
import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";

import { useThreeChannelRenderer } from "./useThreeChannelRenderer";
import { useThreePanZoom } from "./useThreePanZoom";
import { ActiveImageInfoStrip } from "./ActiveImageInfoStrip";
import { screenToImage } from "./coords";
import { useThreeViewport } from "./ThreeViewportContext";
import { ThreeAnnotationLayer } from "./ThreeAnnotationLayer";

type ThreeStageProps = {
  stageWidth: number;
  stageHeight: number;
};

export const ThreeStage = ({ stageWidth, stageHeight }: ThreeStageProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  // Camera/renderer/scene refs are owned by the ThreeViewportProvider (mounted at
  // the ImageViewer root) so the toolbar can drive the camera too. This effect
  // populates them below.
  const { cameraRef, rendererRef, sceneRef, notifyCameraChanged } =
    useThreeViewport();
  const imageCamRef = useRef<THREE.OrthographicCamera | null>(null); // fixed camera for readback
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

  // Composited IJSImage (from GPU readback) that the annotation tools operate on.
  const { ijsImageRef, ijsImageVersion } = useActiveImage();
  const ijsImage = useMemo(
    () => ijsImageRef?.current ?? null,
    [ijsImageRef, ijsImageVersion],
  );

  // Set once the renderer/scene/camera exist, gating the annotation layer.
  const [ready, setReady] = useState(false);

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
    setReady(true);

    return () => {
      setReady(false);
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
    notifyCameraChanged();
  }, [stageWidth, stageHeight, notifyCameraChanged]);

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
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!camera) return;
    camera.position.set(0, 0, 1);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    if (renderer && scene) renderer.render(scene, camera);
    notifyCameraChanged();
  }, [activeImageId, notifyCameraChanged]);

  useEffect(() => {
    const el = mountRef.current;
    const onMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) return;
      const camera = cameraRef.current;
      if (!camera || !el) return;
      const rect = el.getBoundingClientRect();
      const { point, oob } = screenToImage(
        e.clientX - rect.left,
        e.clientY - rect.top,
        {
          stageWidth,
          stageHeight,
          cameraPosX: camera.position.x,
          cameraPosY: camera.position.y,
          cameraZoom: camera.zoom,
          imageWidth,
          imageHeight,
        },
      );
      setOutOfBounds(oob);
      setAbsolutePosition(point);
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
    notifyCameraChanged,
  );

  return (
    <Box sx={{ zIndex: 999 }}>
      <Box
        sx={{
          position: "relative",
          width: stageWidth,
          height: stageHeight,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box ref={mountRef} sx={{ width: stageWidth, height: stageHeight }} />
        {ready && (
          <ThreeAnnotationLayer
            mountRef={mountRef}
            isPanningRef={isPanningRef}
            ijsImage={ijsImage}
            stageWidth={stageWidth}
            stageHeight={stageHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        )}
      </Box>
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
