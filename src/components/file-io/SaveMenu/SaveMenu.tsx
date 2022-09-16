import { useSelector } from "react-redux";

import { Menu, MenuItem } from "@mui/material";

import { useDialog } from "hooks";

import { SaveProjectDialog } from "../SaveProjectDialog/SaveProjectDialog";
import { SaveFittedModelDialog } from "../SaveFittedModelDialog";

import {
  classifierFittedSelector,
  classifierSelectedModelSelector,
} from "store/classifier";
import {
  segmenterFittedModelSelector,
  segmenterArchitectureOptionsSelector,
} from "store/segmenter";

type SaveMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const SaveMenu = ({ anchorEl, onClose, open }: SaveMenuProps) => {
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

  const onMenuDialogClose = (onDialogClose: () => void) => {
    return () => {
      onDialogClose();
      onClose();
    };
  };

  const fittedClassifier = useSelector(classifierFittedSelector);
  const selectedClassifierModelProps = useSelector(
    classifierSelectedModelSelector
  );

  const fittedSegmenter = useSelector(segmenterFittedModelSelector);
  const selectedSegmenterModelProps = useSelector(
    segmenterArchitectureOptionsSelector
  ).selectedModel;

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem onClick={onSaveProjectDialogOpen}>Save project</MenuItem>

      <MenuItem onClick={onSaveClassifierDialogOpen}>Save classifier</MenuItem>

      <MenuItem onClick={onSaveSegmenterDialogOpen}>Save segmenter</MenuItem>

      <SaveProjectDialog
        onClose={onMenuDialogClose(onSaveProjectDialogClose)}
        open={openSaveProjectDialog}
      />

      <SaveFittedModelDialog
        fittedModel={fittedClassifier}
        modelProps={selectedClassifierModelProps}
        modelTypeString={"Classifier"}
        onClose={onMenuDialogClose(onSaveClassifierDialogClose)}
        open={openSaveClassifierDialog}
      />

      <SaveFittedModelDialog
        fittedModel={fittedSegmenter}
        modelProps={selectedSegmenterModelProps}
        modelTypeString={"Segmenter"}
        onClose={onMenuDialogClose(onSaveSegmenterDialogClose)}
        open={openSaveSegmenterDialog}
      />
    </Menu>
  );
};
