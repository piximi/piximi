import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
} from "store/classifier/selectors";
import { Shape } from "store/data/types";
import { SequentialClassifier } from "utils/models/classification/AbstractClassifier";
import { ModelStatus, ModelTask } from "utils/models/enums";
import { Model } from "utils/models/Model";

export const useClassificationModel = () => {
  const dispatch = useDispatch();

  const modelStatus = useSelector(selectClassifierModelStatus);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const [waitingForResults, setWaitingForResults] = React.useState(false);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");

  const handlePredict = () => {
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Evaluating,
      })
    );
  };
  const handleImportModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      dispatch(
        classifierSlice.actions.loadUserSelectedModel({
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
