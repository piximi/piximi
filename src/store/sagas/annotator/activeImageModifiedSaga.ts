import { put, select } from "redux-saga/effects";
import { Color } from "types/Color";
import { imageSelector } from "store/selectors";
import {
  convertImageURIsToImageData,
  mapChannelstoSpecifiedRGBImage,
} from "image/imageHelper";
import { ImageType } from "types/ImageType";
import { imageViewerSlice } from "store/slices";

export function* activeImageIDChangeSaga({
  payload: { imageId },
}: {
  type: string;
  payload: {
    imageId: string;
  };
}): any {
  const image: ImageType | undefined = yield select(imageSelector);

  if (!image) return;

  const planesData: number[][][] = yield convertImageURIsToImageData(
    image.originalSrc
  );

  const renderedSrcs = planesData.map((planeData) => {
    return mapChannelstoSpecifiedRGBImage(
      planeData,
      image.colors,
      image.shape.height,
      image.shape.width
    );
  });

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}

export function* activeImageColorChangeSaga({
  payload: { colors },
}: {
  type: string;
  payload: {
    colors: Array<Color>;
  };
}): any {
  const image: ImageType | undefined = yield select(imageSelector);

  if (!image) return;

  const planesData: number[][][] = yield convertImageURIsToImageData(
    image.originalSrc
  );

  const renderedSrcs = planesData.map((planeData) => {
    return mapChannelstoSpecifiedRGBImage(
      planeData,
      colors,
      image.shape.height,
      image.shape.width
    );
  });

  yield put(
    imageViewerSlice.actions.setActiveImageRenderedSrcs({ renderedSrcs })
  );
}
