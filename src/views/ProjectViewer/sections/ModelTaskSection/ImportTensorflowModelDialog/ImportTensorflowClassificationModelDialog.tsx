import React, { useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { LocalClassifierUpload } from "./LocalFileUpload";
import { RemoteClassifierUpload } from "./CloudUpload";
import { ModelFormatSelection } from "./ModelFormatSelection";

import { HotkeyContext } from "utils/enums";

import { ToolTipTab } from "components/layout";
import classifierHandler from "utils/models/classification/classifierHandler";
import { SequentialClassifier } from "utils/models/classification";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import { selectActiveKindId } from "store/project/selectors";

type ImportTensorflowClassificationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ImportTensorflowClassificationModelDialog = ({
  onClose,
  open,
}: ImportTensorflowClassificationModelDialogProps) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const [uploadedModels, setUploadedModels] = useState<SequentialClassifier[]>(
    [],
  );

  const [isGraph, setIsGraph] = useState(false);

  const [tabVal, setTabVal] = useState("1");
  const [invalidModel, setInvalidModel] = useState(false);

  const confirmUpload = async () => {
    if (uploadedModels.length > 0) {
      dispatch(
        classifierSlice.actions.updateSelectedModelNameOrArch({
          modelName: uploadedModels[0].name,
          kindId: activeKindId,
        }),
      );
    }

    setInvalidModel(false);
    onClose();
  };

  const cancelUpload = () => {
    setInvalidModel(false);
    uploadedModels.forEach((model) => {
      classifierHandler.removeModel(model.name);
    });
    onClose();
  };

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useHotkeys(
    "enter",
    () => {
      uploadedModels.length > 0 && !invalidModel && confirmUpload();
    },
    HotkeyContext.ConfirmationDialog,

    [confirmUpload, uploadedModels, invalidModel],
  );

  return (
    <Dialog fullWidth maxWidth="sm" onClose={cancelUpload} open={open}>
      <DialogTitle>Load Classification model</DialogTitle>

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Upload Local" value="1" placement="top" />

        <ToolTipTab label="Fetch Remote" value="2" placement="top" />
      </Tabs>
      <DialogContent>
        <Box hidden={tabVal !== "1" && tabVal !== "2"} pb={2}>
          <ModelFormatSelection isGraph={isGraph} setIsGraph={setIsGraph} />
        </Box>

        <Box hidden={tabVal !== "1"}>
          <LocalClassifierUpload
            isGraph={isGraph}
            setUploadedModels={setUploadedModels}
          />
        </Box>

        <Box hidden={tabVal !== "2"}>
          <RemoteClassifierUpload
            isGraph={isGraph}
            setUploadedModels={setUploadedModels}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelUpload} color="primary">
          Cancel
        </Button>

        <Button
          onClick={confirmUpload}
          color="primary"
          disabled={uploadedModels.length === 0 || invalidModel}
        >
          Open Classification model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
