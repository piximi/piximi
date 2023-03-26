import { PayloadAction } from "@reduxjs/toolkit";
import { call, put, select } from "redux-saga/effects";

import { AnnotatorSlice, imageInstancesSelector } from "store/annotator";
import { selectActiveImage, selectStagedAnnotations } from "store/data";
import { decodeAnnotations, encodeAnnotations } from "utils/annotator";

import { Colors } from "types/tensorflow";

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
      AnnotatorSlice.actions.setActiveImageRenderedSrcs({
        renderedSrcs: [],
      })
    );
    return;
  }

  yield put(
    AnnotatorSlice.actions.setImageSrc({
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
    AnnotatorSlice.actions.setActiveImageRenderedSrcs({
      renderedSrcs: tmpRenderedSrc,
    })
  );

  let previousStagedAnnotations:
    | ReturnType<typeof selectStagedAnnotations>
    | undefined;

  if (prevImageId) {
    previousStagedAnnotations = yield select(selectStagedAnnotations);
  }

  const imageAnnotations: ReturnType<typeof imageInstancesSelector> =
    yield select(imageInstancesSelector);

  const newDecodedAnnotations: Awaited<ReturnType<typeof decodeAnnotations>> =
    yield call(decodeAnnotations, imageAnnotations);

  yield put(
    AnnotatorSlice.actions.setStagedAnnotations({
      annotations: newDecodedAnnotations,
    })
  );

  if (previousStagedAnnotations) {
    const previousEncodedAnnotations: Awaited<
      ReturnType<typeof encodeAnnotations>
    > = yield call(encodeAnnotations, previousStagedAnnotations);

    yield put(
      AnnotatorSlice.actions.setImageInstances({
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
    AnnotatorSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}

export function* activeImageColorChangeSaga({
  payload: { colors, execSaga },
}: PayloadAction<{
  colors: Colors;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const image: ReturnType<typeof selectActiveImage> = yield select(
    selectActiveImage
  );

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
    AnnotatorSlice.actions.setImageSrc({
      src: renderedSrcs[image.activePlane],
    })
  );

  yield put(
    AnnotatorSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}
