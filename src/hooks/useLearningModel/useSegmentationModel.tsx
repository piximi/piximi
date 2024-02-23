import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  segmenterSlice,
  selectSegmenterModel,
  selectSegmenterModelStatus,
} from "store/slices/segmenter";
import { Shape } from "types";
import { ModelStatus, ModelTask } from "types/ModelType";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { Model } from "utils/common/models/Model";

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
        execSaga: true,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Evaluating,
        execSaga: true,
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
