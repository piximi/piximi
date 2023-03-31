import { useEffect } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { applicationSlice, initSelector } from "store/application";
import { imageViewerSlice, activeImageIdSelector } from "store/imageViewer";
import { loadExampleImage } from "utils/common/image";
import colorImage from "images/cell-painting.png";
import { cellPaintingAnnotations } from "data/exampleImages";
import { SerializedFileType } from "types";
import { dataSlice, selectImageCount } from "store/data";
import { projectSlice } from "store/project";

export enum DispatchLocation {
  Project,
  ImageViewer,
}

const dispatchToProject = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.Project) return;
  const { image, annotationCategories, annotations } = await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  );

  batch(() => {
    dispatch(
      dataSlice.actions.setImages({
        images: [image],
        disposeColorTensors: true,
      })
    );
    dispatch(
      dataSlice.actions.setAnnotationCategories({ annotationCategories })
    );
    dispatch(dataSlice.actions.setAnnotations({ annotations }));
  });
};

const dispatchToImageViewer = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.ImageViewer) return;

  const { image, annotationCategories, annotations } = await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  );

  batch(() => {
    dispatch(
      dataSlice.actions.setImages({
        images: [image],
        disposeColorTensors: true,
      })
    );
    dispatch(
      dataSlice.actions.setAnnotationCategories({ annotationCategories })
    );
    dispatch(dataSlice.actions.setAnnotations({ annotations }));

    dispatch(projectSlice.actions.selectImage({ imageId: image.id }));
    dispatch(
      imageViewerSlice.actions.setActiveImageId({
        imageId: image.id,
        prevImageId: undefined, // no previous images
        execSaga: true,
      })
    );
  });
};

export const useDefaultImage = (location: DispatchLocation) => {
  const dispatch = useDispatch();

  const init = useSelector(initSelector);
  const numProjectImages = useSelector(selectImageCount);
  const activeAnnotatorImageId = useSelector(activeImageIdSelector);

  useEffect(() => {
    if (init) return;

    location === DispatchLocation.Project &&
      numProjectImages === 0 &&
      dispatchToProject(location, dispatch);
    location === DispatchLocation.ImageViewer &&
      activeAnnotatorImageId === undefined &&
      dispatchToImageViewer(location, dispatch);

    dispatch(applicationSlice.actions.initialized());
  }, [dispatch, location, numProjectImages, activeAnnotatorImageId, init]);
};
