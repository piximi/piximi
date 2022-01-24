import {
  IconButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useDialog } from "../../hooks";

import * as tensorflow from "@tensorflow/tfjs";
import { useSelector } from "react-redux";
import { fittedSelector } from "store/selectors/fittedSelector";
import { valImagesSelector } from "store/selectors/valImagesSelector";
import { EvaluateClassifierDialog } from "components/EvaluateClassifierDialog/EvaluateClassifierDialog";
import { useState } from "react";
import { preprocess_predict } from "store/coroutines/classifier/preprocess_predict";
import { architectureOptionsSelector } from "store/selectors/architectureOptionsSelector";
import { RescaleOptions } from "types/RescaleOptions";
import { Category } from "types/Category";
import { LayersModel } from "@tensorflow/tfjs";
import { Image } from "types/Image";
import { rescaleOptionsSelector } from "store/selectors/rescaleOptionsSelector";
import { createdCategoriesSelector } from "store/selectors";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";

type EvaluateClassifierListItemProbs = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateClassifierListItem = (props: EvaluateClassifierListItemProbs) => {
  const { onClose, onOpen, open } = useDialog();

  const [confusionMatrix, setConfusionMatrix] = useState<number[][]>([]);
  const [accuracy, setAccuracy] = useState<number>(-1);
  const [crossEntropy, setCrossEntropy] = useState<number>(-1);
  const [precision, setPrecision] = useState<number>(-1);
  const [recall, setRecall] = useState<number>(-1);

  const validationImages = useSelector(valImagesSelector);
  const rescaleOptions: RescaleOptions = useSelector(rescaleOptionsSelector);
  const architectureOptions = useSelector(architectureOptionsSelector);
  const categories: Category[] = useSelector(createdCategoriesSelector);
  const model: LayersModel = useSelector(fittedSelector);

  const onEvaluateClick = async () => {
    if (validationImages.length === 0) {
      alert("Validation set is empty!");
      return;
    }

    const validationData = await preprocess_predict(
      validationImages,
      rescaleOptions,
      architectureOptions.inputShape
    );

    const validationDataArray = await validationData.toArray();
    const predictions: number[] = [];
    const probabilities: any = [];
    validationDataArray.forEach(
      (item: { xs: tensorflow.Tensor; id: string }) => {
        const input = item.xs;
        const y = model.predict(input.expandDims()) as tensorflow.Tensor;
        const yArr = Array.from(y.dataSync());
        probabilities.push(yArr);

        const idx = tensorflow.argMax(y as tensorflow.Tensor, 1).dataSync()[0];

        predictions.push(idx);
      }
    );

    const categoryIDs = categories.map((c: Category) => c.id);
    const numberOfClasses = categoryIDs.length;
    const imageCategoryIDs = validationImages.map(
      (image: Image) => image.categoryId
    );
    const labels = imageCategoryIDs.map((id: string) =>
      categoryIDs.findIndex((categoryID: string) => {
        return categoryID === id;
      })
    );

    const tensorPredictions = tensorflow.tensor1d(predictions);
    const tensorLabels = tensorflow.tensor1d(labels);

    // compute confusion matrix
    const confusionMatrix = await tensorflow.math
      .confusionMatrix(tensorLabels, tensorPredictions, numberOfClasses)
      .array();

    // open evaluation dialog and display stuff
    setConfusionMatrix(confusionMatrix);

    const oneHotLabels = tensorflow.oneHot(labels, numberOfClasses);
    const oneHotPredictions = tensorflow.oneHot(predictions, numberOfClasses);

    const probabilities2DTensor = tensorflow.tensor2d(probabilities);

    var accuracy: number;
    var crossEntropy: number;
    if (numberOfClasses === 2) {
      accuracy = tensorflow.metrics
        .binaryAccuracy(oneHotLabels, oneHotPredictions)
        .dataSync()[0];
      crossEntropy = tensorflow.metrics
        .binaryCrossentropy(oneHotLabels, probabilities2DTensor)
        .dataSync()[0];
    } else {
      accuracy = tensorflow.metrics
        .categoricalAccuracy(oneHotLabels, probabilities2DTensor)
        .dataSync()[0];
      console.log(
        tensorflow.metrics
          .categoricalAccuracy(oneHotLabels, probabilities2DTensor)
          .print()
      );
      crossEntropy = tensorflow.metrics
        .categoricalCrossentropy(oneHotLabels, probabilities2DTensor)
        .dataSync()[0];
    }
    setAccuracy(accuracy);
    setCrossEntropy(crossEntropy);

    const precision = tensorflow.metrics
      .precision(oneHotLabels, oneHotPredictions)
      .dataSync()[0];
    const recall = tensorflow.metrics
      .recall(oneHotLabels, oneHotPredictions)
      .dataSync()[0];
    setPrecision(precision);
    setRecall(recall);

    onOpen();
  };

  return (
    <>
      <DisabledClassifierListItem {...props}>
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="Evaluate" />
        <IconButton 
          onClick={onEvaluateClick}
          edge="end"
          disabled={props.disabled}
          >
          <KeyboardArrowRightIcon />
        </IconButton>
      </DisabledClassifierListItem>

      <EvaluateClassifierDialog
        openedDialog={open}
        closeDialog={onClose}
        confusionMatrix={confusionMatrix}
        classNames={categories.map((c: Category) => c.name)}
        accuracy={accuracy}
        crossEntropy={crossEntropy}
        precision={precision}
        recall={recall}
      />
    </>
  );
};
