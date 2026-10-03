import { useEffect, useMemo, useRef } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";

import { hexToRGBA, decodeRleArray } from "utils/image";
import { logger } from "utils/logUtils";

import { selectSelectedAnnotations } from "@ImageViewer/state/image-viewer-data/reselectors";
import { selectAnnotationsForRender } from "@ImageViewer/state/operations/reselectors";
import annotationMaskFrag from "@ImageViewer/core/shaders/annotationMask.frag?raw";
import compositeThreeVert from "@ImageViewer/core/shaders/composite-three.vert?raw";

import type { DataArray } from "core/entities";

type MeshEntry = {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
  texture: THREE.DataTexture;
  /**
   * Identity of the mask this mesh was built from — the stored `encodedMask`
   * array, or a pending operation's `decodedMask`. Reference equality, not
   * content, so the check stays O(1) across renders.
   */
  maskRef: object;
  bbKey: string;
  // Colour is a material uniform, deliberately not part of a mesh's identity,
  // so recolouring never rebuilds one.
};

/** Staged-operation results render in this colour rather than a category's. */
const PREVIEW_COLOR = "#00e5ff";
const SELECTED_COLOR = "#ff1010";
/** Interior/border opacity, matching the SVG overlay's `maskToDataURL`. */
const INTERIOR_ALPHA = 128 / 255;
const BORDER_ALPHA = 1;
const disposeEntry = (scene: THREE.Scene | null, entry: MeshEntry) => {
  scene?.remove(entry.mesh);
  entry.geometry.dispose();
  entry.material.dispose();
  entry.texture.dispose();
};

/**
 * Normalize a mask to one byte per pixel for upload. The shader only tests
 * `> 0`, so 16-bit values collapse to 0/255.
 */
const toMaskBytes = (mask: DataArray | Uint8ClampedArray): Uint8Array => {
  // 8-bit data goes to the GPU without a copy.
  if (mask instanceof Uint8Array) return mask;
  if (mask instanceof Uint8ClampedArray) {
    return new Uint8Array(mask.buffer, mask.byteOffset, mask.length);
  }
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] ? 255 : 0;
  return out;
};

/**
 * A decoded mask is already in `DataTexture` layout — bbox-sized, row-major,
 * one byte per pixel — so it uploads to the GPU as-is.
 */
const createMaskTexture = (
  mask: DataArray | Uint8ClampedArray,
  w: number,
  h: number,
) => {
  const data = toMaskBytes(mask);

  const texture = new THREE.DataTexture(
    data,
    w,
    h,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  // R8 rows are `w` bytes; the default alignment of 4 shears odd-width masks.
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Colour and the interior/border split live in the shader, so the only
 * per-annotation state is the mask texture and a vec3. Every instance shares
 * one compiled program — three caches by shader source.
 */
const createMaskMaterial = (texture: THREE.DataTexture) =>
  new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: compositeThreeVert,
    fragmentShader: annotationMaskFrag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uMask: { value: texture },
      uColor: { value: new THREE.Vector3() },
      uInteriorAlpha: { value: INTERIOR_ALPHA },
      uBorderAlpha: { value: BORDER_ALPHA },
    },
  });
/**
 * Renders committed (saved) annotations as textured planes in the ThreeStage
 * scene — the same path that will extend to 3D volume meshes for z-stacks. Each
 * mask uploads as a single-channel texture and is coloured by
 * `annotationMask.frag`, then mapped onto a plane positioned at the
 * annotation's bounding box in world coords (Y flipped to match the image
 * plane). The in-progress "working" annotation is excluded — it lives in the
 * SVG overlay until confirmed, then graduates here.
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
  const visibleAnnotations = useSelector(selectAnnotationsForRender);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const meshesRef = useRef<Map<string, MeshEntry>>(new Map());

  const selectedIds = useMemo(
    () => selectedAnnotations.map((a) => a.id),
    [selectedAnnotations],
  );

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const desiredIds = new Set(visibleAnnotations.map((a) => a.id));
    const meshes = meshesRef.current;

    // Remove annotations no longer present.
    for (const [id, entry] of meshes) {
      if (!desiredIds.has(id)) {
        disposeEntry(scene, entry);
        meshes.delete(id);
      }
    }

    for (const annotation of visibleAnnotations) {
      const bb = annotation.boundingBox;
      const w = bb[2] - bb[0];
      const h = bb[3] - bb[1];
      if (w <= 0 || h <= 0 || !annotation.encodedMask) continue;

      const bbKey = bb.join(",");
      // A pending preview supplies decodedMask directly and keeps the committed
      // encodedMask, so key on whichever identity is actually in play.
      const maskRef: object =
        annotation.decodedMask ?? (annotation.encodedMask as unknown as object);

      const existing = meshes.get(annotation.id);
      if (
        existing &&
        existing.maskRef === maskRef &&
        existing.bbKey === bbKey
      ) {
        continue;
      }
      if (existing) {
        disposeEntry(scene, existing);
        meshes.delete(annotation.id);
      }

      // Prefer an already-decoded mask (a pending operation's result) over
      // decoding the stored RLE. The store still keeps encodedMask as truth.
      const mask =
        annotation.decodedMask ?? decodeRleArray(annotation.encodedMask);

      // A mismatch means the mask and its bounding box disagree, which would
      // otherwise surface as a misshapen or missing annotation.
      if (mask.length !== w * h) {
        logger(
          `mask/bbox mismatch for ${annotation.id}: ${mask.length} vs ${w * h}`,
          { level: "error" },
        );
        continue;
      }
      const texture = createMaskTexture(mask, w, h);
      const material = createMaskMaterial(texture);
      const geometry = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        bb[0] + w / 2 - imageWidth / 2,
        imageHeight / 2 - (bb[1] + h / 2),
        0.01,
      );
      mesh.renderOrder = 1; // draw after the base image plane
      mesh.visible = !(annotation.hidden ?? false);
      scene.add(mesh);

      meshes.set(annotation.id, {
        mesh,
        geometry,
        material,
        texture,
        maskRef,
        bbKey,
      });
    }

    requestRender();
  }, [visibleAnnotations, imageWidth, imageHeight, sceneRef, requestRender]);

  // Colour and visibility. Writes uniforms and flags only — no allocation, no
  // texture upload — so selection, hover and hide/show are effectively free.
  // Must stay declared after the effect above: meshes are created with `uColor`
  // unset, and this fills it in during the same commit, before paint.
  useEffect(() => {
    const meshes = meshesRef.current;
    if (meshes.size === 0) return;

    // A Set, because this loop already walks every annotation — an `includes`
    // per iteration would make it O(n²).
    const selected = new Set(selectedIds);

    for (const annotation of visibleAnnotations) {
      const entry = meshes.get(annotation.id);
      if (!entry) continue;

      // A preview must not be mistakable for committed state — the next click
      // may delete annotations.
      const fill = annotation.isPreview
        ? PREVIEW_COLOR
        : selected.has(annotation.id)
          ? SELECTED_COLOR
          : annotation.category.color;

      const [r, g, b] = hexToRGBA(fill, 0);
      entry.material.uniforms.uColor.value.set(r / 255, g / 255, b / 255);
      entry.mesh.visible = !(annotation.hidden ?? false);
    }

    requestRender();
  }, [visibleAnnotations, selectedIds, requestRender]);

  // Dispose everything on unmount.
  useEffect(() => {
    const meshes = meshesRef.current;
    return () => {
      const scene = sceneRef.current;
      for (const [, entry] of meshes) {
        disposeEntry(scene, entry);
      }
      meshes.clear();
    };
  }, [sceneRef]);
};
