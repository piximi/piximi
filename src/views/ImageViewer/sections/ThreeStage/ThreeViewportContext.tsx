import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";

import { imageToScreenTransform } from "./coords";

import type * as THREE from "three";
import type { ViewportState } from "./coords";

type ScreenTransform = ReturnType<typeof imageToScreenTransform>;

type ThreeViewportValue = {
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.RefObject<THREE.Scene | null>;
  /** Render the scene through the viewport camera (there is no rAF loop). */
  requestRender: () => void;
  /** Current viewport state from the live camera + dims, or null if not ready. */
  getViewportState: () => ViewportState | null;
  /** Image-pixel -> screen-pixel transform for the SVG overlay `<g>`. */
  getImageToScreenTransform: () => ScreenTransform | null;
  /** Subscribe to camera pan/zoom/resize changes; returns an unsubscribe fn. */
  onCameraChange: (cb: () => void) => () => void;
  /** Notify subscribers that the camera transform changed. */
  notifyCameraChanged: () => void;
};

const ThreeViewportContext = createContext<ThreeViewportValue | null>(null);

export const useThreeViewport = (): ThreeViewportValue => {
  const ctx = useContext(ThreeViewportContext);
  if (!ctx) {
    throw new Error(
      "useThreeViewport must be used within a ThreeViewportProvider",
    );
  }
  return ctx;
};

/**
 * Builds the viewport value from the refs/dims owned by ThreeStage. Returned so
 * ThreeStage can both provide it and hand `notifyCameraChanged` to the pan/zoom
 * and resize/reset effects.
 */
export const useThreeViewportValue = (args: {
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.RefObject<THREE.Scene | null>;
  stageWidth: number;
  stageHeight: number;
  imageWidth: number;
  imageHeight: number;
}): ThreeViewportValue => {
  const { cameraRef, rendererRef, sceneRef } = args;

  const subscribersRef = useRef<Set<() => void>>(new Set());

  // Keep the latest dims in a ref so the stable callbacks read current values.
  const dimsRef = useRef({
    stageWidth: args.stageWidth,
    stageHeight: args.stageHeight,
    imageWidth: args.imageWidth,
    imageHeight: args.imageHeight,
  });
  dimsRef.current = {
    stageWidth: args.stageWidth,
    stageHeight: args.stageHeight,
    imageWidth: args.imageWidth,
    imageHeight: args.imageHeight,
  };

  const requestRender = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) renderer.render(scene, camera);
  }, [rendererRef, sceneRef, cameraRef]);

  const getViewportState = useCallback((): ViewportState | null => {
    const camera = cameraRef.current;
    if (!camera) return null;
    const { stageWidth, stageHeight, imageWidth, imageHeight } =
      dimsRef.current;
    return {
      stageWidth,
      stageHeight,
      cameraPosX: camera.position.x,
      cameraPosY: camera.position.y,
      cameraZoom: camera.zoom,
      imageWidth,
      imageHeight,
    };
  }, [cameraRef]);

  const getImageToScreenTransform = useCallback((): ScreenTransform | null => {
    const vp = getViewportState();
    return vp ? imageToScreenTransform(vp) : null;
  }, [getViewportState]);

  const onCameraChange = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  const notifyCameraChanged = useCallback(() => {
    subscribersRef.current.forEach((cb) => cb());
  }, []);

  return useMemo(
    () => ({
      cameraRef,
      rendererRef,
      sceneRef,
      requestRender,
      getViewportState,
      getImageToScreenTransform,
      onCameraChange,
      notifyCameraChanged,
    }),
    [
      cameraRef,
      rendererRef,
      sceneRef,
      requestRender,
      getViewportState,
      getImageToScreenTransform,
      onCameraChange,
      notifyCameraChanged,
    ],
  );
};

export const ThreeViewportProvider = ({
  value,
  children,
}: {
  value: ThreeViewportValue;
  children: ReactNode;
}) => (
  <ThreeViewportContext.Provider value={value}>
    {children}
  </ThreeViewportContext.Provider>
);
