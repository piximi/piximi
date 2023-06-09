import { useEffect } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { applicationSlice, selectInitSettings } from "store/application";
import { imageViewerSlice, selectActiveImageId } from "store/imageViewer";
import { loadExampleImage, loadImjoyImage } from "utils/common/image";
import colorImage from "images/cell-painting.png";
import { cellPaintingAnnotations } from "data/exampleImages";
import { ImageType, SerializedFileType } from "types";
import { dataSlice, selectImageCount } from "store/data";

export enum DispatchLocation {
  Project,
  ImageViewer,
}

const dispatchToProject = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.Project) return;
  await loadImjoyImage((image: ImageType) => {
    dispatch(
      dataSlice.actions.addImages({
        images: [image],
        isPermanent: true,
      })
    );
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
        isPermanent: true,
      })
    );
    dispatch(
      dataSlice.actions.setAnnotationCategories({
        categories: annotationCategories,
        isPermanent: true,
      })
    );
    dispatch(
      dataSlice.actions.setAnnotations({ annotations, isPermanent: true })
    );

    dispatch(imageViewerSlice.actions.setImageStack({ imageIds: [image.id] }));
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

  const init = useSelector(selectInitSettings);
  const numProjectImages = useSelector(selectImageCount);
  const activeAnnotatorImageId = useSelector(selectActiveImageId);

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
