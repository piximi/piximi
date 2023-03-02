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
  ModelType,
  Shape,
  availableClassifierModels,
  availableSegmenterModels,
} from "types";

type ImportTensorflowModelDialogProps = {
  onClose: () => void;
  open: boolean;
  modelKind: "Segmentation" | "Classification";
  dispatchFunction: (
    inputShape: Shape,
    modelName: string,
    modelType: number,
    classifierModel: any,
    modelArch: string
  ) => void;
};

export const ImportTensorflowModelDialog = ({
  onClose,
  open,
  modelKind,
  dispatchFunction,
}: ImportTensorflowModelDialogProps) => {
  // Uploaded Model States
  const [classifierModel, setClassifierModel] = useState<
    GraphModel | LayersModel | undefined
  >();
  const [segmentationModel, setSegmentationModel] = useState<
    GraphModel | LayersModel | undefined
  >();
  const [modelArch, setModelArch] = useState<string>("graph");
  const [modelName, setModelName] = useState<string>("");
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });
  const [pretrainedModels, setPretrainedModels] = useState<
    Array<{ name: string; type: ModelType }>
  >([]);
  const [modelType, setModelType] = useState<number>(0);

  const dispatchModelToStore = () => {
    dispatchFunction(
      inputShape,
      modelName,
      modelType,
      modelKind === "Classification" ? classifierModel : segmentationModel,
      modelArch
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
      modelKind === "Classification"
        ? availableClassifierModels.reduce(
            (
              names: Array<{ name: string; type: ModelType }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                names.push({ name: model.modelName, type: model.modelType });
              }
              return names;
            },
            []
          )
        : availableSegmenterModels.reduce(
            (
              names: Array<{ name: string; type: ModelType }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                names.push({ name: model.modelName, type: model.modelType });
              }
              return names;
            },
            []
          );

    setPretrainedModels(models);
  }, [modelKind]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle>Import {modelKind} model</DialogTitle>

      <LocalFileUpload
        modelType={modelKind}
        modelArch={modelArch}
        setSegmentationModel={setSegmentationModel}
        setClassifierModel={setClassifierModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
      />

      <PretrainedModelSelector
        values={[{ name: "None", type: ModelType.None }, ...pretrainedModels]}
        setSegmentationModel={setSegmentationModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
        setModelType={setModelType}
      />

      <CloudUpload
        modelType={modelKind}
        modelArch={modelArch}
        setSegmentationModel={setSegmentationModel}
        setClassifierModel={setClassifierModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
        setModelArch={setModelArch}
      />

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={
            modelKind === "Classification"
              ? !classifierModel
              : !segmentationModel
          }
        >
          Open {modelKind} model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
