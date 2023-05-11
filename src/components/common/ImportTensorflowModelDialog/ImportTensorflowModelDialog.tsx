import React, { useEffect, useState } from "react";
import { LayersModel, GraphModel } from "@tensorflow/tfjs";

import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";

import { useHotkeys } from "hooks";

import { LocalFileUpload } from "./LocalFileUpload";
import { PretrainedModelSelector } from "./PretrainedModelSelector";
import { CloudUpload } from "./CloudUpload";

import {
  DefaultModelProps,
  HotkeyView,
  Shape,
  availableClassifierModels,
  availableSegmenterModels,
} from "types";
import { ModelArchitecture, ModelTask } from "types/ModelType";

type ImportTensorflowModelDialogProps = {
  onClose: () => void;
  open: boolean;
  modelTask: ModelTask;
  dispatchFunction: (
    inputShape: Shape,
    modelName: string,
    modelArch: ModelArchitecture,
    classifierModel: any,
    graph: boolean
  ) => void;
};

export const ImportTensorflowModelDialog = ({
  onClose,
  open,
  modelTask,
  dispatchFunction,
}: ImportTensorflowModelDialogProps) => {
  // Uploaded Model States
  const [classifierModel, setClassifierModel] = useState<
    GraphModel | LayersModel | undefined
  >();
  const [segmentationModel, setSegmentationModel] = useState<
    GraphModel | LayersModel | undefined
  >();
  const [isGraph, setIsGraph] = useState<boolean>(true);
  const [modelName, setModelName] = useState<string>("");
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });
  const [pretrainedModels, setPretrainedModels] = useState<
    Array<{ name: string; modelArch: ModelArchitecture }>
  >([]);
  const [modelArch, setModelArch] = useState<number>(0);

  const dispatchModelToStore = () => {
    dispatchFunction(
      inputShape,
      modelName,
      modelArch,
      modelTask === ModelTask.Classification
        ? classifierModel
        : segmentationModel,
      isGraph
    );

    closeDialog();
  };

  const closeDialog = () => {
    onClose();
  };

  useHotkeys(
    "enter",
    () => dispatchModelToStore(),
    HotkeyView.ImportTensorflowModelDialog,
    { enableOnTags: ["INPUT"] },
    [dispatchModelToStore]
  );

  useEffect(() => {
    const models =
      modelTask === ModelTask.Classification
        ? availableClassifierModels.reduce(
            (
              trainedModels: Array<{
                name: string;
                modelArch: ModelArchitecture;
              }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                trainedModels.push({
                  name: model.modelName,
                  modelArch: model.modelArch,
                });
              }
              return trainedModels;
            },
            []
          )
        : availableSegmenterModels.reduce(
            (
              trainedModels: Array<{
                name: string;
                modelArch: ModelArchitecture;
              }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                trainedModels.push({
                  name: model.modelName,
                  modelArch: model.modelArch,
                });
              }
              return trainedModels;
            },
            []
          );

    setPretrainedModels(models);
  }, [modelTask]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle>
        Import{" "}
        {modelTask === ModelTask.Classification
          ? "Classification"
          : "Segmentation"}{" "}
        model
      </DialogTitle>

      <LocalFileUpload
        modelTask={modelTask}
        isGraph={isGraph}
        setSegmentationModel={setSegmentationModel}
        setClassifierModel={setClassifierModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
      />

      <PretrainedModelSelector
        values={[
          { name: "None", modelArch: ModelArchitecture.None },
          ...pretrainedModels,
        ]}
        setSegmentationModel={setSegmentationModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
        setModelArch={setModelArch}
      />

      <CloudUpload
        modelTask={modelTask}
        isGraph={isGraph}
        setSegmentationModel={setSegmentationModel}
        setClassifierModel={setClassifierModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
        setIsGraph={setIsGraph}
      />

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={
            modelTask === ModelTask.Classification
              ? !classifierModel
              : !segmentationModel
          }
        >
          Open{" "}
          {modelTask === ModelTask.Classification
            ? "Classification"
            : "Segmentation"}{" "}
          model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
