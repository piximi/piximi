import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { imageViewerSlice } from "@ImageViewer/state/imageViewer";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";

import { imageToScreenTransform } from "./coords";
import { ZOOM_MAX, ZOOM_MIN } from "./consts";

import type * as THREE from "three";
import type { ViewportState } from "./coords";

type ScreenTransform = ReturnType<typeof imageToScreenTransform>;

type ThreeViewportValue = {
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
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
  /** Fit the image to the stage (centered) and mirror to Redux. */
  fitToScreen: () => void;
  /** Reset zoom to 1:1 (centered) and mirror to Redux. */
  zoomToActualSize: () => void;
  /** Recenter the camera on the image at the current zoom. */
  resetPosition: () => void;
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
 * Builds the viewport value from the camera/renderer/scene refs owned by the
 * ThreeViewportProvider. Stage dims are read from the live camera frustum and
 * image dims from the active image, so the value carries no dimension props and
 * can live at the ImageViewer root — above both the stage and the toolbar.
 */
const useThreeViewportValue = (args: {
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
}): ThreeViewportValue => {
  const { cameraRef, rendererRef, sceneRef } = args;
  const dispatch = useDispatch();
  const image = useSelector(selectActiveViewerImage);

  const subscribersRef = useRef<Set<() => void>>(new Set());

  // Image dims come from the active image; kept in a ref so the stable callbacks
  // read current values. Stage dims are derived from the live camera frustum.
  const imageDimsRef = useRef({
    imageWidth: image?.shape.width ?? 1,
    imageHeight: image?.shape.height ?? 1,
  });
  imageDimsRef.current = {
    imageWidth: image?.shape.width ?? 1,
    imageHeight: image?.shape.height ?? 1,
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
    const { imageWidth, imageHeight } = imageDimsRef.current;
    return {
      // Frustum equals the stage size by construction (set in ThreeStage's
      // init/resize effects); zoom/pan never touch it.
      stageWidth: camera.right - camera.left,
      stageHeight: camera.top - camera.bottom,
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

  // Mutate-then-commit: after changing the camera, refresh the projection,
  // re-render, notify overlay subscribers, and mirror the transform to Redux.
  const applyCamera = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.updateProjectionMatrix();
    requestRender();
    notifyCameraChanged();
    dispatch(
      imageViewerSlice.actions.setZoomToolOptions({
        options: { scale: camera.zoom },
      }),
    );
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: { x: camera.position.x, y: camera.position.y },
      }),
    );
  }, [cameraRef, requestRender, notifyCameraChanged, dispatch]);

  const fitToScreen = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { imageWidth, imageHeight } = imageDimsRef.current;
    if (!imageWidth || !imageHeight) return;
    const stageWidth = camera.right - camera.left;
    const stageHeight = camera.top - camera.bottom;
    const fit = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
    camera.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit));
    camera.position.set(0, 0, camera.position.z);
    applyCamera();
  }, [cameraRef, applyCamera]);

  const zoomToActualSize = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.zoom = 1;
    camera.position.set(0, 0, camera.position.z);
    applyCamera();
  }, [cameraRef, applyCamera]);

  const resetPosition = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    // World origin keeps the image centered; preserve the current zoom.
    camera.position.set(0, 0, camera.position.z);
    applyCamera();
  }, [cameraRef, applyCamera]);

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
      fitToScreen,
      zoomToActualSize,
      resetPosition,
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
      fitToScreen,
      zoomToActualSize,
      resetPosition,
    ],
  );
};

export const ThreeViewportProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const value = useThreeViewportValue({ cameraRef, rendererRef, sceneRef });
  return (
    <ThreeViewportContext.Provider value={value}>
      {children}
    </ThreeViewportContext.Provider>
  );
};
