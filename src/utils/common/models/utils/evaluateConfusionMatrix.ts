export const evaluateConfusionMatrix = (
  nClasses: number,
  confusionMatrix: number[][]
) => {
  var precision = 0;
  var recall = 0;
  var f1Score = 0;

  if (nClasses === 2) {
    precision =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[0][1]);
    recall =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[1][0]);
    f1Score = (2 * (precision * recall)) / (precision + recall);
  } else {
    var diagonal: number[] = new Array(nClasses).fill(0);
    var rowSums: number[] = new Array(nClasses).fill(0);
    var colSums: number[] = new Array(nClasses).fill(0);
    for (let i = 0; i < nClasses; i++) {
      for (let j = 0; j < nClasses; j++) {
        if (i === j) {
          diagonal[i] += confusionMatrix[i][j];
        }
        rowSums[i] += confusionMatrix[i][j];
        colSums[j] += confusionMatrix[i][j];
      }
    }

    for (let k = 0; k < nClasses; k++) {
      const classKPrecision = diagonal[k] / rowSums[k];
      const classKRecall = diagonal[k] / colSums[k];
      precision += classKPrecision;
      recall += classKRecall;
      f1Score +=
        (2 * (classKPrecision * classKRecall)) /
        (classKPrecision + classKRecall);
    }
    precision /= nClasses;
    recall /= nClasses;
    f1Score /= nClasses;
  }

  return { precision: precision, recall: recall, f1Score: f1Score };
};
