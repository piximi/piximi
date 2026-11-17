import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";

import type { Dispatch } from "@reduxjs/toolkit";

import type {
  AnnotationObject,
  AnnotationVolume,
  Channel,
  ImageObject,
  ImageSeries,
  Plane,
} from "core/entities";

import type { Backend } from "../types";

const IMAGE_PAGE = 200;
const ANNOTATION_PAGE = 500;
const MASK_BATCH = 200;

/*
 * Fills the store from a backend that holds the project: everything the
 * grids need up front, then masks in batches behind it. For now the whole
 * project is mirrored; paging the store itself comes with the scale phase.
 */
export const hydrateStoreFromBackend = async (
  backend: Backend,
  dispatch: Dispatch,
): Promise<void> => {
  const summary = await backend.query.project();

  const imageSeries = new Map<string, ImageSeries>();
  const images: ImageObject[] = [];
  const planes: Plane[] = [];
  const channels: Channel[] = [];
  for (let cursor: string | undefined; ; ) {
    const page = await backend.query.images({}, { cursor, limit: IMAGE_PAGE });
    for (const record of page.items) {
      imageSeries.set(record.series.id, record.series);
      images.push(record.image);
      planes.push(...record.planes);
      channels.push(...record.channels);
    }
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  const annotationVolumes: AnnotationVolume[] = [];
  const annotations: AnnotationObject[] = [];
  for (let cursor: string | undefined; ; ) {
    const page = await backend.query.annotations(
      {},
      { cursor, limit: ANNOTATION_PAGE },
    );
    for (const record of page.items) {
      annotationVolumes.push(record.volume);
      // Masks follow separately; an empty mask marks one not fetched yet.
      annotations.push({ ...record.annotation, encodedMask: [] });
    }
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  // Slices that keep per-kind state learn of kinds through the add actions,
  // which `setState` bypasses; seed them for every kind the backend holds.
  dispatch(
    classifierSlice.actions.addKindClassifiers(
      summary.kinds.map((kind) => ({ id: kind.id, targetName: kind.name })),
    ),
  );
  dispatch(
    dataSlice.actions.setState({
      experiment: summary.experiment,
      kinds: summary.kinds,
      categories: summary.categories,
      channelMetas: summary.channelMetas,
      imageSeries: [...imageSeries.values()],
      images,
      planes,
      channels,
      annotationVolumes,
      annotations,
    }),
  );

  for (let i = 0; i < annotations.length; i += MASK_BATCH) {
    const batch = annotations.slice(i, i + MASK_BATCH);
    const masks = await backend.query.masks(batch.map((a) => a.id));
    for (const annotation of batch) {
      const encodedMask = masks[annotation.id];
      if (encodedMask) {
        dispatch(
          dataSlice.actions.updateAnnotationMask({
            id: annotation.id,
            boundingBox: annotation.boundingBox,
            encodedMask,
            features: annotation.features,
            intensityMeasurements: annotation.intensityMeasurements ?? {},
          }),
        );
      }
    }
  }
};
