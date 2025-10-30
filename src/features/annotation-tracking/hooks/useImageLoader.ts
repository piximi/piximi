import { useEffect, useState } from "react";

import { Point } from "utils/types";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";

const IMAGE_SPACING = 20;

type HtmlImageRecord = Record<string, { image: HTMLImageElement; pos: Point }>;

/**
 * Hook to load and position HTML image elements for the track viewer.
 * Creates HTMLImageElement instances from image preview URLs and calculates
 * their positions based on image dimensions and spacing.
 *
 * @param activeMetadata - The active metadata containing images to load
 * @param globalShape - The dimensions of each image (width, height)
 * @param stageHeight - Height of the stage for vertical centering
 * @returns Record of image IDs to HTMLImageElement and position
 */
export const useImageLoader = (
  activeMetadata: ImageViewerMetadataDetails | undefined,
  globalShape: { width: number; height: number },
  stageHeight: number,
) => {
  const [htmlImages, setHtmlImages] = useState<HtmlImageRecord>({});

  useEffect(() => {
    if (!activeMetadata || globalShape.width === 0) return;

    const imageElems: HtmlImageRecord = {};

    Object.entries(activeMetadata.images).forEach(([id, image], idx) => {
      const imgElem = document.createElement("img");
      imgElem.src = image.ZTPreview;
      imageElems[id] = {
        image: imgElem,
        pos: {
          x: globalShape.width * idx + IMAGE_SPACING * (idx + 1),
          y: (stageHeight - globalShape.height) / 2,
        },
      };
    });

    setHtmlImages(imageElems);
  }, [activeMetadata?.id, globalShape.width, globalShape.height, stageHeight]);

  return htmlImages;
};
