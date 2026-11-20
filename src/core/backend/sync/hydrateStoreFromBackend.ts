import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";

import type { Dispatch } from "@reduxjs/toolkit";

import type { Backend, ImageRecord } from "../types";

const IMAGE_PAGE = 500;

/*
 * Fills the store from a backend that holds the project. The summary and
 * the first page of images land before this resolves; the rest of the
 * images stream in behind (`mirrored`). The grids read through the backend
 * and need none of it, but the mirror is what the rest of the app reads:
 * categories, channel settings, and an image's planes and channels.
 * Annotations are not mirrored at all; the grids page them on demand and
 * masks are fetched where they are needed.
 */
export const hydrateStoreFromBackend = async (
  backend: Backend,
  dispatch: Dispatch,
): Promise<{ mirrored: Promise<void> }> => {
  const summary = await backend.query.project();

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
      imageSeries: [],
      images: [],
      planes: [],
      channels: [],
      annotationVolumes: [],
      annotations: [],
    }),
  );

  const addPage = (records: ImageRecord[]) => {
    const series = new Map(records.map((r) => [r.series.id, r.series]));
    dispatch(
      dataSlice.actions.addImageSeries({
        imageSeries: [...series.values()],
        images: records.map((r) => r.image),
        planes: records.flatMap((r) => r.planes),
        channels: records.flatMap((r) => r.channels),
        channelMetas: [],
      }),
    );
  };

  if (backend.classification) {
    dispatch(
      classifierSlice.actions.setClassifiers(
        await backend.classification.list(),
      ),
    );
  }

  const first = await backend.query.images(
    {},
    { offset: 0, limit: IMAGE_PAGE },
  );
  addPage(first.items);

  const mirrored = (async () => {
    for (let offset = first.items.length; offset < first.total; ) {
      const page = await backend.query.images(
        {},
        { offset, limit: IMAGE_PAGE },
      );
      if (page.items.length === 0) break;
      addPage(page.items);
      offset += page.items.length;
    }
  })();
  return { mirrored };
};
