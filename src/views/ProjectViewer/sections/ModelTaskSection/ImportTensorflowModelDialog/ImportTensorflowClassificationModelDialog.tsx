import { Fragment, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import JSZip from "jszip";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Modal,
  Tabs,
  Typography,
} from "@mui/material";

import { useBackend } from "core/backend";
import { useClassifierApi } from "core/dl/classification";
import { ARCHITECTURE_LABELS } from "core/dl/classification/types";
import { classifierFromDTO } from "core/dl/classification/utils";
import { zipInputToBuffer } from "core/file-io/file-loader/fileInputUtils";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { classifierSlice } from "store/classifier";

import { parseError } from "utils/logUtils";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { ToolTipTab } from "@ProjectViewer/components";

import { LocalClassifierUpload } from "./LocalFileUpload";
import { RemoteClassifierUpload } from "./CloudUpload";
import { ModelFormatSelection } from "./ModelFormatSelection";

import type React from "react";

import type { Classifier } from "core/dl/classification/types";

/* What the confirmation shows about the loaded model. */
const modelDetails = (
  classifier: Classifier,
): Array<{ label: string; value: string }> => {
  const { inputShape } = classifier.hyperparameters.preprocess;
  return [
    { label: "Name", value: classifier.name },
    {
      label: "Architecture",
      value:
        ARCHITECTURE_LABELS[classifier.architectureId] ??
        classifier.architectureId,
    },
    { label: "Framework", value: classifier.framework },
    { label: "Classes", value: classifier.classes.join(", ") || "N/A" },
    { label: "Trainable", value: String(classifier.trainable) },
    { label: "Trained", value: String(classifier.trained) },
    {
      label: "Input Shape",
      value: [inputShape.height, inputShape.width, inputShape.channels].join(
        ", ",
      ),
    },
  ];
};
type ImportTensorflowClassificationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ImportTensorflowClassificationModelDialog = ({
  onClose,
  open,
}: ImportTensorflowClassificationModelDialogProps) => {
  const dispatch = useDispatch();
  const backend = useBackend();

  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const [uploadResult, setUploadResult] = useState<
    | { success: true; classifier: Classifier }
    | { success: false; reason: string }
  >();

  const [isGraph, setIsGraph] = useState(false);
  const [tabVal, setTabVal] = useState("1");

  const cfApi = useClassifierApi();

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  const activate = (classifier: Classifier) => {
    setUploadResult({ success: true, classifier });
    dispatch(
      classifierSlice.actions.setActiveModel({
        modelName: classifier.id,
        targetId: modelTarget,
      }),
    );
  };

  // The backend reads the archive; loose files are zipped first, since the
  // archive is what travels to a remote one.
  const handleLocalUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    const files = event.currentTarget.files;
    if (!files || files.length === 0 || !backend.classification) return;

    try {
      let data: Uint8Array;
      if (files.length === 1 && files[0].name.endsWith(".zip")) {
        data = new Uint8Array(await zipInputToBuffer(files[0]));
      } else {
        const zip = new JSZip();
        for (const file of Array.from(files)) {
          zip.file(file.name, await file.arrayBuffer());
        }
        data = await zip.generateAsync({ type: "uint8array" });
      }
      activate(
        await backend.classification.import({ targetId: modelTarget, data }),
      );
    } catch (e) {
      setUploadResult({ success: false, reason: parseError(e).message });
    }
  };

  // A tfjs model fetched by URL lives in the browser's own worker, so this
  // tab is only offered by the local backend.
  const handleRemoteUpload = async (modelUrl: string) => {
    const result = await cfApi.modelFromUrl(modelUrl, isGraph);
    if (result.success) {
      const classifier = classifierFromDTO(result.data, modelTarget, []);
      dispatch(classifierSlice.actions.upsertClassifier(classifier));
      activate(classifier);
    } else {
      setUploadResult({
        success: false,
        reason: `[loadModel] ${result.reason.code}: ${result.reason.message}`,
      });
      console.error(
        `[loadModel] ${result.reason.code}: ${result.reason.message}`,
        result.reason.cause,
      );
    }
  };

  const ModalContent = useMemo(
    () =>
      !uploadResult ? (
        <></>
      ) : (
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
          {uploadResult.success ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", width: "100%" }}
            >
              <Typography
                variant="h6"
                sx={{
                  whiteSpace: "pre-line",
                  pb: 2,
                  fontSize: "1.125rem",
                }}
              >
                {`Successfully uploaded ${isGraph ? "Graph" : "Layers"} Model`}
              </Typography>
              <Box
                sx={(theme) => ({
                  display: "grid",

                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.text.primary}`,

                  gridTemplateColumns: "max-content 1fr",
                  "& div": {
                    display: "flex",
                    alignItems: "center",
                    py: 0.5,
                    px: 1,
                    borderBottom: `1px solid ${theme.palette.text.primary}`,
                  },
                  "& div:nth-of-type(even)": {
                    justifyContent: "center",
                    borderLeft: `1px solid ${theme.palette.text.primary}`,
                  },
                  "& div:nth-last-of-type(-n + 2)": {
                    borderBottom: "none",
                  },
                })}
              >
                {modelDetails(uploadResult.classifier).map(
                  ({ label, value }) => (
                    <Fragment key={`model-detail-${label}`}>
                      <Box>
                        <Typography variant="body2">{label}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2">{value}</Typography>
                      </Box>
                    </Fragment>
                  ),
                )}
              </Box>
              {uploadResult.classifier.runs.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-line",
                  }}
                >
                  No previous run information found
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="h6">Error</Typography>

              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-line",
                }}
              >
                Failed to upload model
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-line",
                }}
              >
                {uploadResult.reason}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="text"
              onClick={() => {
                setUploadResult(undefined);
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      ),
    [uploadResult, isGraph],
  );

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitleBar title="Load Classification Model" closeDialog={onClose} />

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Upload Local" value="1" placement="top" />

        <ToolTipTab
          label="Fetch Remote"
          value="2"
          placement="top"
          disabled={backend.kind !== "local"}
          disabledMessage="Only the in-browser backend can fetch a tfjs model by URL"
        />
      </Tabs>
      <DialogContent sx={{ pb: 0 }}>
        <Box
          hidden={tabVal !== "1" && tabVal !== "2"}
          sx={{
            pb: 2,
          }}
        >
          <ModelFormatSelection isGraph={isGraph} setIsGraph={setIsGraph} />
        </Box>

        <Box hidden={tabVal !== "1"}>
          <LocalClassifierUpload onUploadModel={handleLocalUpload} />
        </Box>

        <Box hidden={tabVal !== "2"}>
          <RemoteClassifierUpload onUploadModel={handleRemoteUpload} />
        </Box>
      </DialogContent>

      <Modal open={!!uploadResult} hideBackdrop>
        {ModalContent}
      </Modal>
    </Dialog>
  );
};
