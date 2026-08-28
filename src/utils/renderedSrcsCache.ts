import type { BBox, ExtendedChannel } from "store/data/types";

const MAX_SIZE = 200;
const cache = new Map<string, string>();

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
}

export function clearCache(): void {
  cache.clear();
}
