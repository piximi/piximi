import type React from "react";
import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  Popper,
  Tabs,
  Typography,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { ToolTipTab } from "components/layout";

import { classifierSlice } from "store/classifier";
import { selectActiveKindId } from "@ProjectViewer/state/selectors";

import { HotkeyContext } from "utils/enums";
import { useClassifierApi } from "utils/dl/classification";
import { logger } from "utils/logUtils";
import type { ModelInfoDTO, Run } from "utils/dl/classification/types";

import { LocalClassifierUpload } from "./LocalFileUpload";
import { RemoteClassifierUpload } from "./CloudUpload";
import { ModelFormatSelection } from "./ModelFormatSelection";

type ImportTensorflowClassificationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ImportTensorflowClassificationModelDialog = ({
  onClose,
  open,
}: ImportTensorflowClassificationModelDialogProps) => {
  const dispatch = useDispatch();
  const [uploadedModels, setUploadedModels] = useState<{
    modelDetails: ModelInfoDTO;
    runs: Run[];
  }>();

  const [isGraph, setIsGraph] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errMessage, setErrMessage] = useState<string>("");
  const [tabVal, setTabVal] = useState("1");
  const [invalidModel] = useState(false);

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
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
            setUploadedModel={setUploadedModels}
            setErrMessage={setErrMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </Box>

        <Box hidden={tabVal !== "2"}>
          <RemoteClassifierUpload
            isGraph={isGraph}
            setUploadedModel={setUploadedModels}
            setErrMessage={setErrMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </Box>
      </DialogContent>
      <Modal
        open={successMessage.length > 0 || errMessage.length > 0}
        onClose={() => {
          setErrMessage("");
          setSuccessMessage("");
        }}
        hideBackdrop
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: theme.palette.background.default,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 24,
            pt: 2,
            px: 2,
          })}
        >
          {errMessage.length > 0 && (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-line",
                color: "red",
              }}
            >
              {errMessage}
            </Typography>
          )}
          {successMessage.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="h6">Success</Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-line",
                  color: "green",
                }}
              >
                {successMessage}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setErrMessage("");
                    setSuccessMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setErrMessage("");
                    setSuccessMessage("");
                  }}
                >
                  Confirm
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Dialog>
  );
};
