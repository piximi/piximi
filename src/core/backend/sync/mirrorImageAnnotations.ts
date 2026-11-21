import { dataSlice } from "store/data";

import type { Dispatch } from "@reduxjs/toolkit";

import type {
  AnnotationObject,
  AnnotationVolume,
  ImageSeries,
} from "core/entities";

import type { RootState } from "store/rootReducer";

import type { Backend, ImageRecord } from "../types";

const IMAGE_PAGE = 500;
const ANNOTATION_PAGE = 1000;
const MASK_CHUNK = 500;

const chunks = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    out.push(items.slice(start, start + size));
  }
  return out;
};

const addRecords = (records: ImageRecord[], dispatch: Dispatch) => {
  const series = new Map<string, ImageSeries>();
  for (const record of records) series.set(record.series.id, record.series);
  dispatch(
    dataSlice.actions.addImageSeries({
      imageSeries: [...series.values()],
      images: records.map((record) => record.image),
      planes: records.flatMap((record) => record.planes),
      channels: records.flatMap((record) => record.channels),
      channelMetas: [],
    }),
  );
};

/*
 * Brings some images' annotations into the mirror, with their masks, for
 * a viewing session on a project whose annotations are otherwise never
 * mirrored. The images themselves are mirrored too if the background
 * stream has not reached them yet. The session evicts all of it when it
 * ends (`evictImageAnnotations`).
 */
export const mirrorImageAnnotations = async (
  backend: Backend,
  store: { getState(): RootState; dispatch: Dispatch },
  imageIds: string[],
): Promise<{ annotations: number }> => {
  const { images } = store.getState().data;
  const missing = imageIds.filter((id) => !images.entities[id]);
  for (const ids of chunks(missing, IMAGE_PAGE)) {
    const page = await backend.query.images({ ids }, { limit: IMAGE_PAGE });
    addRecords(page.items, store.dispatch);
  }

  const headers: Array<{
    volume: AnnotationVolume;
    annotation: Omit<AnnotationObject, "encodedMask" | "decodedMask">;
  }> = [];
  for (let offset = 0; ; ) {
    const page = await backend.query.annotations(
      { imageIds },
      { offset, limit: ANNOTATION_PAGE },
    );
    headers.push(...page.items);
    offset += page.items.length;
    if (page.items.length === 0 || offset >= page.total) break;
  }
  const masks: Record<string, number[]> = {};
  for (const ids of chunks(
    headers.map(({ annotation }) => annotation.id),
    MASK_CHUNK,
  )) {
    Object.assign(masks, await backend.query.masks(ids));
  }

  const volumes = new Map<string, AnnotationVolume>();
  const annotations: AnnotationObject[] = [];
  for (const { volume, annotation } of headers) {
    const encodedMask = masks[annotation.id];
    if (!encodedMask) continue;
    volumes.set(volume.id, volume);
    annotations.push({ ...annotation, encodedMask });
  }
  store.dispatch(
    dataSlice.actions.batchAddAnnotationVolume([...volumes.values()]),
  );
  store.dispatch(dataSlice.actions.batchAddAnnotation(annotations));
  return { annotations: annotations.length };
};
