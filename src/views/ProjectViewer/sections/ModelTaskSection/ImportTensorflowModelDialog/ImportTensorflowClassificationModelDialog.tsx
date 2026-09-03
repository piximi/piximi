import type React from "react";
import { Fragment, useMemo, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Modal,
  Tabs,
  Typography,
} from "@mui/material";

import { ToolTipTab } from "@ProjectViewer/components";
import { classifierSlice } from "store/classifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassifierApi } from "core/dl/classification";
import { type ModelInfoDTO, type Run } from "core/dl/classification/types";
import { modelInfoDTOToModelInfo } from "core/dl/classification/utils";
import { zipInputToBuffer } from "core/file-io/file-loader/fileInputUtils";
import {
  importFittedModelFromZip,
  importFittedModelFromFiles,
} from "core/file-io/import/importFittedModel";
import {
  MODEL_MANIFEST_FILENAME,
  MODEL_RUNS_FILENAME,
} from "core/file-io/consts";

import { parseError } from "utils/logUtils";

import { LocalClassifierUpload } from "./LocalFileUpload";
import { RemoteClassifierUpload } from "./CloudUpload";
import { ModelFormatSelection } from "./ModelFormatSelection";

const modelDetailFields: Array<
  keyof Pick<
    ModelInfoDTO,
    | "name"
    | "modelArch"
    | "classes"
    | "trainable"
    | "pretrained"
    | "defaultInputShape"
    | "defaultOutputShape"
    | "requiredChannels"
  >
> = [
  "name",
  "modelArch",
  "classes",
  "trainable",
  "pretrained",
  "defaultInputShape",
  "defaultOutputShape",
  "requiredChannels",
];
type ImportTensorflowClassificationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ImportTensorflowClassificationModelDialog = ({
  onClose,
  open,
}: ImportTensorflowClassificationModelDialogProps) => {
  const dispatch = useDispatch();

  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const [uploadResult, setUploadResult] = useState<
    | {
        success: true;
        modelDetails: ModelInfoDTO;
        runs: Run[];
      }
    | { success: false; reason: string }
  >();

  const [isGraph, setIsGraph] = useState(false);
  const [tabVal, setTabVal] = useState("1");

  const cfApi = useClassifierApi();

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };
  const handleLocalUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    try {
      let modelDetails: ModelInfoDTO;
      let runs: Run[];

      if (files.length === 1 && files[0].name.endsWith(".zip")) {
        const buffer = await zipInputToBuffer(files[0]);
        ({ modelDetails, runs } = await importFittedModelFromZip(buffer));
      } else {
        const fileArray = Array.from(files);
        const manifest = fileArray.find(
          (f) => f.name === MODEL_MANIFEST_FILENAME,
        );
        const modelJson = fileArray.find(
          (f) =>
            f.name.endsWith(".json") &&
            f.name !== MODEL_RUNS_FILENAME &&
            f.name !== MODEL_MANIFEST_FILENAME,
        );
        const modelWeights = fileArray.filter((f) => f.name.endsWith(".bin"));
        const modelRuns = fileArray.find((f) => f.name === MODEL_RUNS_FILENAME);

        if (!modelJson || modelWeights.length === 0) {
          const missing = [
            !modelJson && "Model Topology (.json)",
            modelWeights.length === 0 && "Model Weights (.bin)",
          ]
            .filter(Boolean)
            .join(", ");
          throw new Error(`Missing required file(s): ${missing}`);
        }

        ({ modelDetails, runs } = await importFittedModelFromFiles({
          modelJson,
          modelWeights,
          modelRuns,
          manifest,
        }));
      }

      const modelInfo = modelInfoDTOToModelInfo(modelDetails, runs);
      setUploadResult({ success: true, modelDetails, runs });
      batch(() => {
        dispatch(
          classifierSlice.actions.addModelInfo({
            targetId: modelTarget,
            modelName: modelDetails.name,
            modelInfo,
          }),
        );
        dispatch(
          classifierSlice.actions.setActiveModel({
            modelName: modelDetails.name,
            targetId: modelTarget,
          }),
        );
      });
    } catch (e) {
      setUploadResult({ success: false, reason: parseError(e).message });
    }
  };
  const handleRemoteUpload = async (modelUrl: string) => {
    const result = await cfApi.modelFromUrl(modelUrl, isGraph);
    if (result.success) {
      const modelDetails = result.data;
      setUploadResult({ success: true, modelDetails: modelDetails, runs: [] });
      const modelInfo = modelInfoDTOToModelInfo(modelDetails, []);
      batch(() => {
        dispatch(
          classifierSlice.actions.addModelInfo({
            targetId: modelTarget,
            modelName: modelDetails.name,
            modelInfo,
          }),
        );
        dispatch(
          classifierSlice.actions.setActiveModel({
            modelName: modelDetails.name,
            targetId: modelTarget,
          }),
        );
      });
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

  const getModelDetailValue = <T extends (typeof modelDetailFields)[number]>(
    field: T,
    value: ModelInfoDTO[T],
  ) => {
    switch (field) {
      case "modelArch":
        if (value === undefined) return "N/A";
        return value === 0 ? "Simple CNN" : "MobileNet";
      case "defaultInputShape":
      case "classes":
        return (value as Array<string>).join(", ");
      case "requiredChannels":
        if (!value) return "N/A";
        return value;
      default:
        return String(value);
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
                {modelDetailFields.map((field) => (
                  <Fragment key={`model-detail-${field}`}>
                    <Box>
                      <Typography variant="body2" textTransform="capitalize">
                        {field}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        {getModelDetailValue(
                          field,
                          uploadResult.modelDetails[field],
                        )}
                      </Typography>
                    </Box>
                  </Fragment>
                ))}
              </Box>
              {uploadResult.runs.length === 0 && (
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
      <DialogTitle>Load Classification Model</DialogTitle>

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Upload Local" value="1" placement="top" />

        <ToolTipTab label="Fetch Remote" value="2" placement="top" />
      </Tabs>
      <DialogContent sx={{ pb: 0 }}>
        <Box hidden={tabVal !== "1" && tabVal !== "2"} pb={2}>
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
