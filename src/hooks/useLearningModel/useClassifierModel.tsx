import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  classifierSlice,
  loadUserSelectedModel,
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
} from "store/slices/classifier";
import { Shape } from "types";
import { ModelStatus, ModelTask } from "types/ModelType";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Model } from "utils/common/models/Model";

export const useClassificationModel = () => {
  const dispatch = useDispatch();

  const modelStatus = useSelector(selectClassifierModelStatus);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const [waitingForResults, setWaitingForResults] = React.useState(false);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");

  const handlePredict = () => {
    dispatch(
      classifierSlice.actions.updateModelStatusNew({
        modelStatus: ModelStatus.Predicting,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      classifierSlice.actions.updateModelStatusNew({
        modelStatus: ModelStatus.Evaluating,
      })
    );
  };
  const handleImportModel = (model: Model, inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      dispatch(
        loadUserSelectedModel({
          inputShape: inputShape,
          model,
        })
      );
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Classification]}`
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
        // setHelperText("Evaluating...");
        break;
      case ModelStatus.Predicting:
        setHelperText("Predcting...");
        break;
      case ModelStatus.Suggesting:
        setHelperText("Accept/Reject suggested predictions first");
        break;
      default:
      //setHelperText("No Trained Model");
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
