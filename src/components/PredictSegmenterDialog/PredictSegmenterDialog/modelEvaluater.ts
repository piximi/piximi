import * as tensorflow from "@tensorflow/tfjs";

export const evaluateTensorflowModel = (
  model: tensorflow.LayersModel,
  evaluationData: tensorflow.Tensor<tensorflow.Rank>[],
  labels: number[],
  numberOfClasses: number
) => {
  return returnResult(model, evaluationData, labels, numberOfClasses);
};

export const evaluateTensorflowModelCV = async (
  model: tensorflow.LayersModel,
  evaluationData: tensorflow.Tensor<tensorflow.Rank>[],
  labels: number[],
  numberOfClasses: number
) => {
  const dataSize = evaluationData.length;
  const k = Math.min(10, Math.ceil(Math.sqrt(dataSize) as number));

  const dataFolds = Array.from(
    Array(Math.ceil(evaluationData.length / k)),
    (_, i) => evaluationData.slice(i * k, i * k + k)
  );
  const labelFolds = Array.from(Array(Math.ceil(labels.length / k)), (_, i) =>
    labels.slice(i * k, i * k + k)
  );

  model.compile({
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
    optimizer: tensorflow.train.adam(),
  });

  var accuracy = 0;
  var crossEntropy = 0;
  var confusionMatrixArray: tensorflow.backend_util.TypedArray = new Int32Array(
    numberOfClasses * numberOfClasses
  );
  for (let i = 0; i < k; i++) {
    var validationData: tensorflow.Tensor<tensorflow.Rank>[] = dataFolds[i];
    var trainData: tensorflow.Tensor<tensorflow.Rank>[] = [];

    var validationLabels: number[] = labelFolds[i];
    var trainLabels: number[] = [];

    for (var j = 0; j < k; j++) {
      if (j !== i) {
        trainData = trainData.concat(dataFolds[j]);
        trainLabels = trainLabels.concat(labelFolds[j]);
      }
    }

    let concatenatedTensorData = tensorflow.tidy(() =>
      tensorflow.concat(trainData)
    );

    let concatenatedLabelData = tensorflow.tidy(() =>
      tensorflow.oneHot(trainLabels, numberOfClasses)
    );
    await model.fit(concatenatedTensorData, concatenatedLabelData);

    var evaluationResult = returnResult(
      model,
      validationData,
      validationLabels,
      numberOfClasses
    );
    crossEntropy += evaluationResult.crossEntropy;
    accuracy += evaluationResult.accuracy;
    for (let c = 0; c < confusionMatrixArray.length; c++) {
      confusionMatrixArray[c] += evaluationResult.confusionMatrixArray[c];
    }
  }
  for (let c = 0; c < confusionMatrixArray.length; c++) {
    confusionMatrixArray[c] = confusionMatrixArray[c] / k;
  }
  return {
    accuracy: accuracy / k,
    crossEntropy: crossEntropy / k,
    confusionMatrixArray: confusionMatrixArray,
  };
};

const returnResult = (
  model: tensorflow.LayersModel,
  evaluationData: tensorflow.Tensor<tensorflow.Rank>[],
  labels: number[],
  numberOfClasses: number
) => {
  var predictions: any = [];
  for (let i: number = 0; i < evaluationData.length; i++) {
    var prediction = model.predict(evaluationData[i]);
    predictions.push(prediction);
  }

  var accuracy;
  var crossEntropy;
  if (numberOfClasses === 2) {
    accuracy = tensorflow.metrics
      .binaryAccuracy(tensorflow.tensor(labels), predictions)
      .dataSync()[0];
    crossEntropy = tensorflow.metrics
      .binaryCrossentropy(tensorflow.tensor(labels), predictions)
      .dataSync()[0];
  } else {
    let concatenatedLabelData = tensorflow.tidy(() =>
      tensorflow.oneHot(labels, numberOfClasses)
    );
    accuracy = tensorflow.metrics
      .categoricalAccuracy(concatenatedLabelData, predictions)
      .dataSync()[0];
    crossEntropy = tensorflow.metrics
      .categoricalCrossentropy(tensorflow.tensor(labels), predictions)
      .dataSync()[0];
  }
  var confusionMatrixArray = tensorflow.math
    .confusionMatrix(tensorflow.tensor(labels), predictions, numberOfClasses)
    .dataSync();

  return {
    accuracy: accuracy,
    crossEntropy: crossEntropy,
    confusionMatrixArray: confusionMatrixArray,
  };
};
