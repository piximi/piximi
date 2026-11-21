import { useEffect, useState } from "react";

import { toChannelDisplay, useBackend } from "core/backend";

import { useKeyedAsync } from "./useKeyedAsync";

import type { Backend } from "core/backend";
import type { ExtendedChannel } from "core/entities";

export type CompositeImage = {
  width: number;
  height: number;
  /* RGBA, top row first, as the backend composited it. */
  data: Uint8Array<ArrayBuffer>;
};

/* Slider drags change the display settings many times a second; the
 * backend is asked once they settle. The first picture of a plane is not
 * delayed. */
const SETTLE_MS = 120;

const decode = async (dataUrl: string): Promise<CompositeImage> => {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob, {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("No 2D context to decode the composite");
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      width: bitmap.width,
      height: bitmap.height,
      data: new Uint8Array(data.buffer as ArrayBuffer),
    };
  } finally {
    bitmap.close();
  }
};

const loadComposite = async (
  backend: Backend,
  channels: ExtendedChannel[],
): Promise<CompositeImage | undefined> => {
  const image = await backend.render.image({
    channels: channels.map(toChannelDisplay),
  });
  return decode(image.dataUrl);
};

/*
 * The active plane as the backend composites it, for a backend that keeps
 * its pixels to itself (no `raw-local`): the viewer shows this picture and
 * hands it to the annotation tools, which work on the composite either way.
 * Keyed on the visible channels and their display settings, so a contrast
 * change asks for a new picture; a backend serving raw pixels gets nothing
 * from here.
 */
export function useCompositeImage(channels: ExtendedChannel[]): {
  composite: CompositeImage | undefined;
  loading: boolean;
} {
  const backend = useBackend();
  const composited = !backend.render.raw;
  const visible = channels.filter((c) => c.visible);
  const planeKey = visible.map((c) => c.id).join("|");
  const key =
    !composited || visible.length === 0
      ? null
      : JSON.stringify(
          visible.map((c) => [c.id, c.colorMap, c.rampMin, c.rampMax]),
        );

  // Settings changes settle before they are sent; a new plane does not
  // wait for the timer, since its key is used as soon as it differs.
  const [settled, setSettled] = useState<{
    key: string | null;
    plane: string;
  }>({ key, plane: planeKey });
  const newPlane = planeKey !== settled.plane;
  useEffect(() => {
    if (key === settled.key) return;
    const timer = setTimeout(
      () => setSettled({ key, plane: planeKey }),
      newPlane || key === null ? 0 : SETTLE_MS,
    );
    return () => clearTimeout(timer);
  }, [key, planeKey, settled.key, newPlane]);
  const settledKey = newPlane || key === null ? key : settled.key;

  const { latest, loading } = useKeyedAsync(settledKey, () =>
    loadComposite(backend, visible),
  );

  return {
    composite: key === null ? undefined : latest,
    loading: composited && (loading || key !== settledKey),
  };
}
