import type { BBox, ExtendedChannel } from "core/entities";

/*
 * Rendered thumbnails by what they show. Only the grids' windows are ever
 * preloaded, so the cache holds a few screens' worth around the view; a
 * cell subscribes to its key and repaints when a preload lands.
 */
const MAX_SIZE = 2000;
const cache = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

export function getCacheKey(channels: ExtendedChannel[], crop?: BBox): string {
  const cropStr = crop ? crop.join(",") : "full";
  return (
    channels
      .map(
        (c) =>
          `${c.storageReference.storageId}:${c.rampMin}:${c.rampMax}:${c.colorMap}:${String(c.visible)}`,
      )
      .join("|") +
    "|" +
    cropStr
  );
}

const notify = (key: string) => {
  for (const listener of listeners.get(key) ?? []) listener();
};

export function getRenderedSrc(key: string): string | undefined {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

export function setRenderedSrc(key: string, url: string): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= MAX_SIZE) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, url);
  notify(key);
}

export function deleteRenderedSrc(key: string): void {
  if (cache.delete(key)) notify(key);
}

export function subscribeRenderedSrc(
  key: string,
  listener: () => void,
): () => void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
  };
}

export function clearCache(): void {
  cache.clear();
  for (const key of listeners.keys()) notify(key);
}
