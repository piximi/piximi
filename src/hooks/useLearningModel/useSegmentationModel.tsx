import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { segmenterSlice } from "store/segmenter";
import {
  selectSegmenterModel,
  selectSegmenterModelStatus,
} from "store/segmenter/selectors";

import { Segmenter } from "utils/models/segmentation";
import { Model } from "utils/models/Model";

import { ModelStatus, ModelTask } from "utils/models/enums";
import { Shape } from "store/data/types";

export const useSegmentationModel = () => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(selectSegmenterModel);
  const modelStatus = useSelector(selectSegmenterModelStatus);
  const [waitingForResults, setWaitingForResults] = React.useState(false);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");

  const handlePredict = () => {
    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Evaluating,
      })
    );
  };
  const handleImportModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof Segmenter) {
      if (model.pretrained) {
        await model.loadModel();
      }

      dispatch(
        segmenterSlice.actions.loadUserSelectedModel({
          inputShape,
          model: model as Segmenter,
        })
      );
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Segmentation]}`
      );
    }
  };

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained) {
      return;
    }

    switch (modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Loading:
      case ModelStatus.Training:
        setHelperText("Disabled during training");
        break;
      case ModelStatus.Evaluating:
        setHelperText("Evaluating...");
        break;
      case ModelStatus.Predicting:
        setHelperText("Predcting...");
        break;
      case ModelStatus.Suggesting:
        setHelperText("Accept/Reject suggested predictions first");
        break;
      default:
        setHelperText("No Trained Model");
    }
  }, [modelStatus]);
  return {
    modelStatus,
    selectedModel,
    handlePredict,
    handleEvaluate,
    helperText,
    waitingForResults,
    setWaitingForResults,
    handleImportModel,
  };
};
