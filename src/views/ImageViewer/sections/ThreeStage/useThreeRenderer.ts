import { useEffect, useRef, useState } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";

import { useThreeViewport } from "./ThreeViewportContext";

/**
 * Owns the WebGL renderer, scene, and viewport camera for the ThreeStage, and
 * holds the invariant that the camera frustum always equals the stage size —
 * which ThreeViewportContext's `getViewportState` reads back as stageWidth/Height.
 * The refs themselves belong to ThreeViewportProvider so the toolbar can drive
 * the camera; this hook populates and maintains them.
 */
export const useThreeRenderer = (stageWidth: number, stageHeight: number) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { cameraRef, rendererRef, sceneRef, notifyCameraChanged } =
    useThreeViewport();
  const [ready, setReady] = useState(false);
  const activeImageId = useSelector(selectActiveImageId);

  // --- Create renderer / scene / camera (once) ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(stageWidth, stageHeight);
    mount.appendChild(renderer.domElement);

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
      mount.removeChild(renderer.domElement);
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
    };
    // Runs once for the life of the stage. The three refs come from the provider
    // and are stable; listing them would make this effect's identity depend on
    // the provider's memoization, and a miss there would thrash the GL context.
  }, []);

  // --- Keep the frustum equal to the stage size ---
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
  }, [stageWidth, stageHeight, ready, notifyCameraChanged]);

  // --- Reset the viewport camera when the active image changes ---
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
  }, [activeImageId, ready, notifyCameraChanged]);

  return { mountRef, ready };
};
