import { PayloadAction } from "@reduxjs/toolkit";
import { call, put, select } from "redux-saga/effects";

import { imageViewerSlice } from "store/annotator";
import {
  dataSlice,
  selectActiveImage,
  selectActiveImageAnnotationIds,
} from "store/data";
import { ImageType } from "types";

import { createRenderedTensor } from "utils/common/image";

export function* activeImageIDChangeSaga({
  payload: { imageId, prevImageId, execSaga },
}: PayloadAction<{
  imageId: string | undefined;
  prevImageId: string | undefined;
  execSaga: boolean;
}>) {
  if (!execSaga) return;
  const image: ReturnType<typeof selectActiveImage> = yield select(
    selectActiveImage
  );

  if (!image) {
    yield put(
      imageViewerSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs: [],
      })
    );
    return;
  }
  const activeImageAnnotationIds: ReturnType<
    typeof selectActiveImageAnnotationIds
  > = yield select(selectActiveImageAnnotationIds);

  yield put(
    imageViewerSlice.actions.setActiveAnnotationIds({
      annotationIds: activeImageAnnotationIds,
    })
  );

  /*
   * Since converting each plane to image data, and mapping them to RGBs
   * can take some time, there is a a window of time where the previous
   * active image will be shown in the annotator. To avoid this, we want
   * to first set renderedSrcs to a mostly blank array, with the only
   * filled element being just the already rendered image src,
   * then after prerendering srcs for each plane, we replace it.
   */
  const tmpRenderedSrc = Array(image.shape.planes);
  tmpRenderedSrc[image.activePlane] = image.src;
  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({
      renderedSrcs: tmpRenderedSrc,
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
  payload: { imageId, updates, execSaga },
}: PayloadAction<{
  imageId: string;
  updates: Partial<ImageType>;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const image: ReturnType<typeof selectActiveImage> = yield select(
    selectActiveImage
  );

  if (!image) return;
  const { colors } = updates;
  if (!colors) return;

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
    dataSlice.actions.updateStagedImage({
      imageId: image.id,
      updates: { src: renderedSrcs[image.activePlane] },
    })
  );

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}
