import { PayloadAction } from "@reduxjs/toolkit";
import { call, put, select } from "redux-saga/effects";

import { imageViewerSlice } from "store/image-viewer";
import { imageSelector } from "store/common";

import { Colors } from "types/tensorflow";

import { createRenderedTensor } from "image/utils/imageHelper";

// TODO: image_data (including all prerendering machinary, generally)
export function* activeImageIDChangeSaga({
  payload: { imageId, execSaga },
}: PayloadAction<{ imageId: string | undefined; execSaga: boolean }>) {
  if (!execSaga) return;

  const image: ReturnType<typeof imageSelector> = yield select(imageSelector);

  if (!image) {
    yield put(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs: [],
      })
    );
    return;
  }

  /*
   * Since converting each plane to image data, and mapping them to RGBs
   * can take some time, there is a a window of time where the previous
   * active image will be shown in the annotator. To avoid this, we want
   * to first set renderedSrcs to just the already rendered image src,
   * then after prerendering srcs for each plane, we replace it.
   */
  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({
      renderedSrcs: [image.src],
    })
  );

  const renderedSrcs: Awaited<
    ReturnType<typeof createRenderedTensor<undefined>>
  > = yield call(
    createRenderedTensor,
    image.data,
    image.colors,
    image.bitDepth,
    undefined
  );

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}

export function* activeImageColorChangeSaga({
  payload: { colors, execSaga },
}: PayloadAction<{
  colors: Colors;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const image: ReturnType<typeof imageSelector> = yield select(imageSelector);

  if (!image) return;

  const colorsEditable = {
    range: { ...colors.range },
    visible: { ...colors.visible },
    color: colors.color,
  };

  const renderedSrcs: Awaited<
    ReturnType<typeof createRenderedTensor<undefined>>
  > = yield call(
    createRenderedTensor,
    image.data,
    colorsEditable,
    image.bitDepth,
    undefined
  );

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}
