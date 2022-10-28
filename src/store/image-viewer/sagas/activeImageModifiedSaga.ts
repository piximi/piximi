import { PayloadAction } from "@reduxjs/toolkit";
import { call, put, select } from "redux-saga/effects";

import {
  imageViewerSlice,
  imageInstancesSelector,
  stagedAnnotationsSelector,
} from "store/image-viewer";
import { imageSelector } from "store/common";
import { decodeAnnotations, encodeAnnotations } from "utils/annotator";

import { Colors } from "types/tensorflow";

import { createRenderedTensor } from "image/utils/imageHelper";

export function* activeImageIDChangeSaga({
  payload: { imageId, prevImageId, execSaga },
}: PayloadAction<{
  imageId: string | undefined;
  prevImageId: string | undefined;
  execSaga: boolean;
}>) {
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

  yield put(
    imageViewerSlice.actions.setImageSrc({
      src: image.src,
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

  let previousStagedAnnotations:
    | ReturnType<typeof stagedAnnotationsSelector>
    | undefined;

  if (prevImageId) {
    previousStagedAnnotations = yield select(stagedAnnotationsSelector);
  }

  const imageAnnotations: ReturnType<typeof imageInstancesSelector> =
    yield select(imageInstancesSelector);

  const newDecodedAnnotations: Awaited<ReturnType<typeof decodeAnnotations>> =
    yield call(decodeAnnotations, imageAnnotations);

  yield put(
    imageViewerSlice.actions.setStagedAnnotations({
      annotations: newDecodedAnnotations,
    })
  );

  if (previousStagedAnnotations) {
    const previousEncodedAnnotations: Awaited<
      ReturnType<typeof encodeAnnotations>
    > = yield call(encodeAnnotations, previousStagedAnnotations);

    yield put(
      imageViewerSlice.actions.setImageInstances({
        instances: previousEncodedAnnotations,
        imageId: prevImageId!,
      })
    );
  }

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
    imageViewerSlice.actions.setImageSrc({
      src: renderedSrcs[image.activePlane],
    })
  );

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}
