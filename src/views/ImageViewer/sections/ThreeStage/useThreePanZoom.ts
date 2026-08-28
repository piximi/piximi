import { useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { imageViewerSlice } from "@ImageViewer/state/imageViewer";
import { selectZoomToolOptions } from "@ImageViewer/state/imageViewer/selectors";

import { useThreeViewport } from "./ThreeViewportContext";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_SPEED } from "./consts";

export function useThreePanZoom(
  mountRef: React.RefObject<HTMLDivElement | null>,
) {
  const dispatch = useDispatch();
  const { automaticCentering } = useSelector(selectZoomToolOptions);

  const { cameraRef, rendererRef, sceneRef, notifyCameraChanged } =
    useThreeViewport();

  const automaticCenteringRef = useRef(automaticCentering);
  const isPanningRef = useRef(false);

  useEffect(() => {
    automaticCenteringRef.current = automaticCentering;
  }, [automaticCentering]);

  useEffect(() => {
    const el = mountRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!el || !camera || !renderer || !scene) return;

    let lastX = 0,
      lastY = 0;

    const render = () => renderer.render(scene, camera);

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (!camera || !el) return;
      const factor = 1 + (e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED);
      const oldZoom = camera.zoom;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, oldZoom * factor));

      camera.zoom = newZoom;
      camera.updateProjectionMatrix();

      if (!automaticCenteringRef.current) {
        const rect = el.getBoundingClientRect();
        const mouseXFromCenter = e.clientX - rect.left - rect.width / 2;
        const mouseYFromCenter = e.clientY - rect.top - rect.height / 2;
        camera.position.x += mouseXFromCenter * (1 / oldZoom - 1 / newZoom);
        camera.position.y -= mouseYFromCenter * (1 / oldZoom - 1 / newZoom);
      } else {
        camera.position.x *= oldZoom / newZoom;
        camera.position.y *= oldZoom / newZoom;
      }

      render();
      notifyCameraChanged?.();
      dispatch(
        imageViewerSlice.actions.setZoomToolOptions({
          options: { scale: newZoom },
        }),
      );
    }

    function onMouseDown(e: MouseEvent) {
      if (e.altKey || e.button === 1) {
        isPanningRef.current = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!isPanningRef.current || !camera) return;
      camera.position.x -= (e.clientX - lastX) / camera.zoom;
      camera.position.y += (e.clientY - lastY) / camera.zoom;
      lastX = e.clientX;
      lastY = e.clientY;
      render();
      notifyCameraChanged?.();
    }

    function onMouseUp() {
      if (!isPanningRef.current || !camera) return;
      isPanningRef.current = false;
      dispatch(
        imageViewerSlice.actions.setStagePosition({
          stagePosition: { x: camera.position.x, y: camera.position.y },
        }),
      );
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    mountRef,
    cameraRef,
    rendererRef,
    sceneRef,
    dispatch,
    notifyCameraChanged,
  ]);
  return { isPanningRef };
}
