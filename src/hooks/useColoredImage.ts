import { useCallback, useEffect, useState } from "react";
import { TensorStorageService } from "services";
import { ImageObject } from "store/data/types";
import { hasTensorReference } from "store/data/utils";
import { parseError } from "utils/errorUtils";
import { ColorsRaw } from "utils/types";

export function useColoredImage(image: ImageObject | null) {
  const [coloredImage, setColoredImage] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!image || !hasTensorReference(image)) {
      setColoredImage(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadRenderedImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const storage = TensorStorageService.getInstance();
        const result = await storage.retrieve(
          image.id,
          image.tensorRef.storeName,
        );
        if (!cancelled && result.success && result.data.buffer) {
          const [planes, height, width, channels] = result.data.shape;
          const buffer = result.data.buffer;
          const pixels = new Float32Array(buffer);
          const planeSize = height * width * channels;

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const imageData = ctx.createImageData(width, height);
          const rgba = imageData.data;
          for (let i = 0; i < height * width; i++) {
            let r = 0,
              b = 0,
              g = 0;
            for (let c = 0; c < channels; c++) {
              if (!image.colors.visible[c]) continue;
              const [min, max] = image.colors.range[c];
              const raw = pixels[i * channels + c];
              const scaled = Math.min(
                1,
                Math.max(0, (raw - min) / (max - min)),
              );
              const [cr, cg, cb] = image.colors.color[c];
              r += scaled * cr;
              g += scaled * cg;
              b += scaled * cb;
            }
            const idx = i * 4;
            rgba[idx] = Math.min(255, r * 255);
            rgba[idx + 1] = Math.min(255, g * 255);
            rgba[idx + 2] = Math.min(255, b * 255);
            rgba[idx + 3] = 255;
          }
          ctx.putImageData(imageData, 0, 0);
          setColoredImage(canvas);
        }
      } catch (err) {
        setError(parseError(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRenderedImage();

    return () => {
      cancelled = true;
    };
  }, [image, reloadTrigger]);

  return { coloredImage, loading };
}
