import { useEffect, useRef } from "react";

import { useSelector } from "react-redux";

import * as THREE from "three";
import { Image as IJSImage } from "image-js-latest";

import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { selectActiveExtendedChannels } from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";
import type { BitDepth, ExtendedChannel } from "store/data/types";

import compositeFrag from "./shaders/composite.frag?raw";
import compositeThreeVert from "./shaders/composite-three.vert?raw";
import { useThreeViewport } from "./ThreeViewportContext";

const MAX_CHANNELS = 16;

const normalize = (
  data: Uint8Array | Uint16Array,
  bitDepth: BitDepth,
): Float32Array => {
  const max = 2 ** bitDepth - 1;
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] / max;
  return out;
};

const buildDataArrayTexture = (
  layers: Float32Array[],
  width: number,
  height: number,
): THREE.DataArrayTexture => {
  const combined = new Float32Array(width * height * layers.length);
  layers.forEach((layer, i) => combined.set(layer, i * width * height));
  const tex = new THREE.DataArrayTexture(
    combined,
    width,
    height,
    layers.length,
  );
  tex.format = THREE.RedFormat;
  tex.type = THREE.FloatType;
  tex.internalFormat = "R32F";
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
};

const buildUniforms = (
  channels: ExtendedChannel[],
  tex: THREE.DataArrayTexture,
) => {
  const visible = channels.filter((c) => c.visible);
  const n = Math.min(visible.length, MAX_CHANNELS);
  const maxVal = (c: ExtendedChannel) => 2 ** c.bitDepth - 1;

  const pad = (arr: number[], len: number, fill: number) => [
    ...arr,
    ...Array(Math.max(0, len - arr.length)).fill(fill),
  ];

  return {
    uChannels: { value: tex },
    uChannelCount: { value: n },
    uColorMaps: {
      value: pad(
        visible.flatMap((c) => [...c.colorMap]),
        MAX_CHANNELS * 3,
        0,
      ),
    },
    uRampMins: {
      value: pad(
        visible.map((c) => c.rampMin / maxVal(c)),
        MAX_CHANNELS,
        0,
      ),
    },
    uRampMaxes: {
      value: pad(
        visible.map((c) => c.rampMax / maxVal(c)),
        MAX_CHANNELS,
        1,
      ),
    },
    uVisible: {
      value: Array.from({ length: MAX_CHANNELS }, (_, i) =>
        i < n ? 1.0 : 0.0,
      ),
    },
  };
};

export const useThreeChannelRenderer = (
  imageWidth: number,
  imageHeight: number,
) => {
  const { channelData, onIjsImageReady, onRawDataRendered } = useActiveImage();
  const activeImageId = useSelector(selectActiveImageId);
  const activeChannels = useParameterizedSelector(
    selectActiveExtendedChannels,
    activeImageId ?? "",
  );

  const { cameraRef, rendererRef, sceneRef } = useThreeViewport();

  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const texRef = useRef<THREE.DataArrayTexture | null>(null);
  const imageCamRef = useRef<THREE.OrthographicCamera | null>(null); // fixed camera for readback

  const imageTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);

  // --- Image-sized camera + render target for IJSImage readback ---
  useEffect(() => {
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
  // --- Init mesh + material when image dimensions change ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: compositeThreeVert,
      fragmentShader: compositeFrag,
      uniforms: {
        uChannels: { value: null },
        uChannelCount: { value: 0 },
        uColorMaps: { value: new Array(MAX_CHANNELS * 3).fill(0) },
        uRampMins: { value: new Array(MAX_CHANNELS).fill(0) },
        uRampMaxes: { value: new Array(MAX_CHANNELS).fill(1) },
        uVisible: { value: new Array(MAX_CHANNELS).fill(0) },
      },
    });
    const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    materialRef.current = material;
    meshRef.current = mesh;

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, [sceneRef, imageWidth, imageHeight]);

  useEffect(() => {
    const mat = materialRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const imageCam = imageCamRef.current;
    const target = imageTargetRef.current;
    const scene = sceneRef.current;
    if (!mat || !renderer || !camera || !imageCam || !target || !scene) return;
    if (channelData.length === 0) {
      if (meshRef.current) meshRef.current.visible = false;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    const layers = channelData.map(({ data, bitDepth }) =>
      normalize(data, bitDepth),
    );
    if (layers.some((l) => l.length !== imageWidth * imageHeight)) return;

    texRef.current?.dispose();
    texRef.current = buildDataArrayTexture(layers, imageWidth, imageHeight);

    const visibleCount = activeChannels.filter((c) => c.visible).length;
    if (meshRef.current) meshRef.current.visible = visibleCount > 0;

    const u = buildUniforms(activeChannels, texRef.current);
    Object.entries(u).forEach(([key, val]) => {
      mat.uniforms[key] = val;
    });
    mat.needsUpdate = true;

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    renderer.setRenderTarget(target);
    renderer.render(scene, imageCam);
    renderer.setRenderTarget(null);

    const buf = new Uint8Array(imageWidth * imageHeight * 4);
    renderer.readRenderTargetPixels(target, 0, 0, imageWidth, imageHeight, buf);
    // Three.js stage has origin at lower left corner, but imageJS expects top left
    // so the image needs to be flipped before being saved and later used in annotation
    // tools
    onIjsImageReady(
      new IJSImage(imageWidth, imageHeight, {
        data: buf,
        colorModel: "RGBA",
      }).flip({ axis: "vertical" }),
    );
    onRawDataRendered();
  }, [channelData, activeChannels, imageWidth, imageHeight]);
};
