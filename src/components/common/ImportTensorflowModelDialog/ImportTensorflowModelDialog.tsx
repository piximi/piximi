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
import { ModelArchitecture, TheModel } from "types/ModelType";

type ImportTensorflowModelDialogProps = {
  onClose: () => void;
  open: boolean;
  modelKind: "Segmentation" | "Classification";
  dispatchFunction: (
    inputShape: Shape,
    modelName: string,
    theModel: TheModel,
    classifierModel: any,
    modelArch: ModelArchitecture
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
  const [modelArch, setModelArch] = useState<ModelArchitecture>(
    ModelArchitecture.Graph
  );
  const [modelName, setModelName] = useState<string>("");
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });
  const [pretrainedModels, setPretrainedModels] = useState<
    Array<{ name: string; theModel: TheModel }>
  >([]);
  const [theModel, setTheModel] = useState<number>(0);

  const dispatchModelToStore = () => {
    dispatchFunction(
      inputShape,
      modelName,
      theModel,
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
              trainedModels: Array<{ name: string; theModel: TheModel }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                trainedModels.push({
                  name: model.modelName,
                  theModel: model.theModel,
                });
              }
              return trainedModels;
            },
            []
          )
        : availableSegmenterModels.reduce(
            (
              trainedModels: Array<{ name: string; theModel: TheModel }>,
              model: DefaultModelProps
            ) => {
              if (model.pretrained) {
                trainedModels.push({
                  name: model.modelName,
                  theModel: model.theModel,
                });
              }
              return trainedModels;
            },
            []
          );

    setPretrainedModels(models);
  }, [modelKind]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle>Import {modelKind} model</DialogTitle>

      <LocalFileUpload
        modelKind={modelKind}
        modelArch={modelArch}
        setSegmentationModel={setSegmentationModel}
        setClassifierModel={setClassifierModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
      />

      <PretrainedModelSelector
        values={[
          { name: "None", theModel: TheModel.None },
          ...pretrainedModels,
        ]}
        setSegmentationModel={setSegmentationModel}
        setInputShape={setInputShape}
        setModelName={setModelName}
        setTheModel={setTheModel}
      />

      <CloudUpload
        modelKind={modelKind}
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
