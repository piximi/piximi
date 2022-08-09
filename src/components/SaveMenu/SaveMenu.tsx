import { bindMenu } from "material-ui-popup-state";
import { Menu, MenuItem } from "@mui/material";
import { useDialog } from "hooks";
import { SaveProjectDialog } from "../SaveProjectDialog/SaveProjectDialog";
import { SaveFittedModelDialog } from "../SaveFittedModelDialog";
import { useSelector } from "react-redux";
import { fittedSelector } from "store/selectors/fittedSelector";
import { selectedModelSelector } from "store/selectors/selectedModelSelector";
import {
  fittedSegmentationModelSelector,
  segmentationArchitectureOptionsSelector,
} from "store/selectors/segmenter";

type SaveMenuProps = {
  popupState: any;
};

export const SaveMenu = ({ popupState }: SaveMenuProps) => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialog();

  const {
    onClose: onSaveClassifierDialogClose,
    onOpen: onSaveClassifierDialogOpen,
    open: openSaveClassifierDialog,
  } = useDialog();

  const {
    onClose: onSaveSegmenterDialogClose,
    onOpen: onSaveSegmenterDialogOpen,
    open: openSaveSegmenterDialog,
  } = useDialog();

  const fittedClassifier = useSelector(fittedSelector);
  const selectedClassifierModelProps = useSelector(selectedModelSelector);

  const fittedSegmenter = useSelector(fittedSegmentationModelSelector);
  const selectedSegmenterModelProps = useSelector(
    segmentationArchitectureOptionsSelector
  ).selectedModel;

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuItem onClick={onSaveProjectDialogOpen}>Save project</MenuItem>

      <MenuItem onClick={onSaveClassifierDialogOpen}>Save classifier</MenuItem>

      <MenuItem onClick={onSaveSegmenterDialogOpen}>Save segmenter</MenuItem>

      <SaveProjectDialog
        onClose={onSaveProjectDialogClose}
        open={openSaveProjectDialog}
        popupState={popupState}
      />

      <SaveFittedModelDialog
        fittedModel={fittedClassifier}
        modelProps={selectedClassifierModelProps}
        modelTypeString={"Classifier"}
        onClose={onSaveClassifierDialogClose}
        open={openSaveClassifierDialog}
        popupState={popupState}
      />

      <SaveFittedModelDialog
        fittedModel={fittedSegmenter}
        modelProps={selectedSegmenterModelProps}
        modelTypeString={"Segmenter"}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
        popupState={popupState}
      />
    </Menu>
  );
};
