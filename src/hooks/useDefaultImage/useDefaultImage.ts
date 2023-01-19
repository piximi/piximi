import { useEffect } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { projectSlice, imagesCountSelector } from "store/project";
import { imageViewerSlice, activeImageIdSelector } from "store/image-viewer";
import { loadDefaultImage } from "./defaultImage";

export enum DispatchLocation {
  Project,
  ImageViewer,
}

const dispatchToProject = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.Project) return;
  const { image, categories } = await loadDefaultImage();
  dispatch(projectSlice.actions.setAnnotationCategories({ categories }));
  dispatch(projectSlice.actions.setImages({ images: [image] }));
};

const dispatchToImageViewer = async (
  location: DispatchLocation,
  dispatch: ReturnType<typeof useDispatch>
) => {
  if (location !== DispatchLocation.ImageViewer) return;

  const { image, categories } = await loadDefaultImage();

  dispatch(projectSlice.actions.setAnnotationCategories({ categories }));
  batch(() => {
    dispatch(
      imageViewerSlice.actions.setImages({
        images: [image],
        disposeColorTensors: false,
      })
    );
    dispatch(
      imageViewerSlice.actions.setActiveImage({
        imageId: image.id,
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
