import { batch, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ConfirmationDialog } from "components/dialogs";

import { dataSlice } from "store/data";

import { imageViewerDataSlice } from "views/ImageViewer/state/imageViewerData";

import { annotatorSlice } from "@ImageViewer/state/annotator";
import { useSavedDataState } from "@ImageViewer/contexts/DataProvider";

type ExitAnnotatorDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExitAnnotatorDialog = ({
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { savedData } = useSavedDataState();

  const handleSaveChanges = (save: boolean) => {
    if (!save) {
      if (savedData) dispatch(dataSlice.actions.resetState(savedData));
    }
    navigate("/project");
    batch(() => {
      dispatch(imageViewerDataSlice.actions.resetState());
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ConfirmationDialog
      title="Save Changes?"
      content="Would you like to save the changes to these annotations and return to the project page?"
      onConfirm={() => handleSaveChanges(true)}
      confirmText="SAVE"
      onReject={() => handleSaveChanges(false)}
      rejectText="DISCARD"
      onClose={handleClose}
      isOpen={open}
    />
  );
};
