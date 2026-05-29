import type React from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";
import { FileOpen as FileOpenIcon } from "@mui/icons-material";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { classifierSlice } from "store/classifier";

import type { ModelInfoDTO, Run } from "utils/dl/classification/types";
import { zipInputToBuffer } from "utils/file-io-v2/file-loader/fileInputUtils";
import { importFittedModelFromZip } from "utils/file-io-v2/import/importFittedModel";
import { parseError } from "utils/logUtils";
import { modelInfoDTOToModelInfo } from "utils/dl/classification/utils";

//TODO: MenuItem??

export const LocalClassifierUpload = ({
  isGraph,
  setUploadedModel,
  setErrMessage,
  setSuccessMessage,
}: {
  isGraph: boolean;
  setUploadedModel: React.Dispatch<
    React.SetStateAction<
      | {
          modelDetails: ModelInfoDTO;
          runs: Run[];
        }
      | undefined
    >
  >;
  setErrMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const dispatch = useDispatch();

  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.persist();
    const files = event.currentTarget.files;
    if (!files) {
      return;
    }

    const results: {
      loadedModels: ModelInfoDTO[];
      failedModels: Record<string, { reason: string; err?: Error }>;
    } = {
      loadedModels: [],
      failedModels: {},
    };

    const file = files[0];
    const buffer = await zipInputToBuffer(file);
    try {
      const { modelDetails, runs } = await importFittedModelFromZip(buffer);
      const modelInfo = modelInfoDTOToModelInfo(modelDetails, runs);
      setSuccessMessage(
        `Successfully uploaded Classification ${
          isGraph ? "Graph" : "Layers"
        } Models: "${results.loadedModels.map((model) => model.name).join(", ")}"`,
      );
      setUploadedModel({ modelDetails, runs });
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
      setErrMessage(parseError(e).message);
      return;
    }
  };

  return (
    <>
      <Typography>Upload model files from your computer.</Typography>
      <Typography gutterBottom fontSize={"small"}>
        Tensorflow requires a .json files containing the model description as
        well as the corresponding model weights (.bin file(s)).
      </Typography>

      <label htmlFor="open-model-file">
        <MenuItem component="span" dense sx={{ ml: 2 }}>
          <ListItemIcon>
            <FileOpenIcon />
          </ListItemIcon>
          <ListItemText primary="Select model files" />
        </MenuItem>
      </label>
      <input
        accept=".zip"
        hidden
        type="file"
        id="open-model-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleFilesSelected(event)
        }
      />
    </>
  );
};
