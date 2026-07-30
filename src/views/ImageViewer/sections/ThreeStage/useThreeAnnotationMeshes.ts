import { useEffect, useMemo, useRef } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import {
  selectExtendedImageById,
  selectExtendedAnnotationsByImageId,
} from "store/dataV2/selectors";
import { colorOverlayROI, hexToRGBA } from "views/ImageViewer/utils";
import { decode } from "views/ImageViewer/utils/rle";
import { useParameterizedSelector } from "store/hooks";
import {
  selectSelectedAnnotations,
  selectVisibleAnnotations,
} from "@ImageViewer/state/image-viewer-data/reselectors";

type MeshEntry = {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  texture: THREE.Texture;
  encodedMaskRef: Array<number>;
  bbKey: string;
  fillColor: string;
};

/**
 * Renders committed (saved) annotations as textured planes in the ThreeStage
 * scene — the same path that will extend to 3D volume meshes for z-stacks. The
 * mask is rasterized to an RGBA overlay via `colorOverlayROI` (interior alpha
 * 128, border 255) and mapped onto a plane positioned at the annotation's
 * bounding box in world coords (Y flipped to match the image plane). The
 * in-progress "working" annotation is excluded — it lives in the SVG overlay
 * until confirmed, then graduates here.
 */
export const useThreeAnnotationMeshes = ({
  sceneRef,
  requestRender,
  imageWidth,
  imageHeight,
}: {
  sceneRef: React.RefObject<THREE.Scene | null>;
  requestRender: () => void;
  imageWidth: number;
  imageHeight: number;
}) => {
  const visibleAnnotations = useSelector(selectVisibleAnnotations);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const meshesRef = useRef<Map<string, MeshEntry>>(new Map());

  const selectedIds = useMemo(
    () => selectedAnnotations.map((a) => a.id),
    [selectedAnnotations],
  );
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const committed = visibleAnnotations;
    const desiredIds = new Set(committed.map((a) => a.id));
    const meshes = meshesRef.current;

    const disposeEntry = (entry: MeshEntry) => {
      scene.remove(entry.mesh);
      entry.geometry.dispose();
      entry.material.dispose();
      entry.texture.dispose();
    };

    // Remove annotations no longer present.
    for (const [id, entry] of meshes) {
      if (!desiredIds.has(id)) {
        disposeEntry(entry);
        meshes.delete(id);
      }
    }

    for (const annotation of committed) {
      const bb = annotation.boundingBox;
      const w = Math.round(bb[2] - bb[0]);
      const h = Math.round(bb[3] - bb[1]);
      let fillColor: string;
      if (selectedIds.includes(annotation.id)) fillColor = "#ff1010";
      else fillColor = annotation.category.color;
      if (w <= 0 || h <= 0 || !annotation.encodedMask) continue;

      const hidden = false;
      const bbKey = bb.join(",");
      const existing = meshes.get(annotation.id);

      // Reuse the mesh unless the mask (by stable encoded reference), bbox, or
      // color changed. Keying on encodedMask — not a freshly decoded array —
      // keeps the reuse check stable across renders.
      if (
        existing &&
        existing.encodedMaskRef === annotation.encodedMask &&
        existing.bbKey === bbKey &&
        existing.fillColor === fillColor
      ) {
        existing.mesh.visible = !hidden;
        continue;
      }
      if (existing) {
        disposeEntry(existing);
        meshes.delete(annotation.id);
      }

      // Decode the RLE mask lazily — only when (re)building this mesh, not on
      // every render. The store keeps the compact encodedMask as source of truth.
      const decodedMask = Uint8Array.from(decode(annotation.encodedMask));
      const color = hexToRGBA(fillColor, 0);
      const img = colorOverlayROI(
        decodedMask,
        bb,
        imageWidth,
        imageHeight,
        color,
        1,
      );
      if (!img) continue;

      const texture = new THREE.Texture(img);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      const markReady = () => {
        texture.needsUpdate = true;
        requestRender();
      };
      // colorOverlayROI sets `img.src` to a data URL; decode may be pending.
      if (img.complete && img.naturalWidth > 0) markReady();
      else img.onload = markReady;

      const geometry = new THREE.PlaneGeometry(w, h);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        bb[0] + w / 2 - imageWidth / 2,
        imageHeight / 2 - (bb[1] + h / 2),
        0.01,
      );
      mesh.renderOrder = 1; // draw after the base image plane
      mesh.visible = !hidden;
      scene.add(mesh);

      meshes.set(annotation.id, {
        mesh,
        geometry,
        material,
        texture,
        encodedMaskRef: annotation.encodedMask,
        bbKey,
        fillColor,
      });
    }

    requestRender();
  }, [
    visibleAnnotations,
    imageWidth,
    imageHeight,
    sceneRef,
    requestRender,
    selectedIds,
  ]);

  // Dispose everything on unmount.
  useEffect(() => {
    const meshes = meshesRef.current;
    return () => {
      const scene = sceneRef.current;
      for (const [, entry] of meshes) {
        scene?.remove(entry.mesh);
        entry.geometry.dispose();
        entry.material.dispose();
        entry.texture.dispose();
      }
      meshes.clear();
    };
  }, [sceneRef]);
};
