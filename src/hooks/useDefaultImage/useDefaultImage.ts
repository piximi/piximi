import { useEffect } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { projectSlice, imagesCountSelector } from "store/project";
import { AnnotatorSlice, activeImageIdSelector } from "store/annotator";
import { loadExampleImage } from "image/utils/loadExampleImage";
import colorImage from "images/cell-painting.png";
import { cellPaintingAnnotations } from "data/exampleImages";
import { SerializedFileType } from "types";

export enum DispatchLocation {
  Project,
  ImageViewer,
}

const dispatchToProject = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.Project) return;
  const { image, categories } = await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  );
  dispatch(projectSlice.actions.setAnnotationCategories({ categories }));
  dispatch(projectSlice.actions.setImages({ images: [image] }));
};

const dispatchToImageViewer = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.ImageViewer) return;

  const { image, categories } = await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  );

  dispatch(projectSlice.actions.setAnnotationCategories({ categories }));
  batch(() => {
    dispatch(
      AnnotatorSlice.actions.setImages({
        images: [image],
        disposeColorTensors: true,
      })
    );
    dispatch(
      AnnotatorSlice.actions.setActiveImage({
        imageId: image.id,
        prevImageId: undefined, // no previous images
        execSaga: true,
      })
    );
  });
};

export const useDefaultImage = (location: DispatchLocation) => {
  const dispatch = useDispatch();

  const numProjectImages = useSelector(imagesCountSelector);
  const activeAnnotatorImageId = useSelector(activeImageIdSelector);

  useEffect(() => {
    location === DispatchLocation.Project &&
      numProjectImages === 0 &&
      dispatchToProject(location, dispatch);
    location === DispatchLocation.ImageViewer &&
      activeAnnotatorImageId === undefined &&
      dispatchToImageViewer(location, dispatch);
  }, [dispatch, location, numProjectImages, activeAnnotatorImageId]);
};
