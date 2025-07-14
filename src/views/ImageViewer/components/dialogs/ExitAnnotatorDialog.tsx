import { batch, useDispatch, useSelector } from "react-redux";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { selectActiveImageId } from "views/ImageViewer/state/imageViewer/selectors";
import { reconcileChanges } from "views/ImageViewer/utils/annotationUtils";
import { selectDataState } from "store/data/selectors";
import { selectChanges } from "views/ImageViewer/state/annotator/selectors";

type ExitAnnotatorDialogProps = {
  returnToProject: () => void;
  onClose: () => void;
  open: boolean;
};

export const ExitAnnotatorDialog = ({
  returnToProject,
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  const dispatch = useDispatch();
  const dataState = useSelector(selectDataState);
  const annotatorChanges = useSelector(selectChanges);
  const activeImageId = useSelector(selectActiveImageId);

  const handleSaveChanges = async () => {
    await reconcileChanges(dataState, annotatorChanges);

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageSeriesId({
          imageId: undefined,
          prevImageId: activeImageId,
        }),
      );
      dispatch(imageViewerSlice.actions.setImageStack({ images: {} }));
      dispatch(
        annotatorSlice.actions.setSelectedAnnotationIds({
          annotationIds: [],
          workingAnnotationId: undefined,
        }),
      );
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
      );
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
    returnToProject();
  };

  const handleDiscardChanges = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageSeriesId({
          imageId: undefined,
          prevImageId: activeImageId,
        }),
      );
      dispatch(annotatorSlice.actions.resetChanges());
      dispatch(
        annotatorSlice.actions.setSelectedAnnotationIds({
          annotationIds: [],
          workingAnnotationId: undefined,
        }),
      );
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
      );
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
    returnToProject();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ConfirmationDialog
      title="Save Changes?"
      content="Would you like to save the changes to these annotations and return to the project page?"
      onConfirm={handleSaveChanges}
      confirmText="SAVE"
      onReject={handleDiscardChanges}
      rejectText="DISCARD"
      onClose={handleClose}
      isOpen={open}
    />
  );
};
