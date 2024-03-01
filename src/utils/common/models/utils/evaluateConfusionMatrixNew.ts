export const evaluateConfusionMatrixNew = (
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
    const baseMetrics: Record<
      string,
      { precision: number; recall: number; f1Score: number }
    > = {};
    const averageMetrics: {
      precision: number;
      recall: number;
      f1Score: number;
    } = { precision: 0, recall: 0, f1Score: 0 };
    for (let i = 0; i < nClasses; i++) {
      const tp = confusionMatrix[i][i];
      const fn = confusionMatrix[i].reduce((sum, fn, idx) => {
        if (i === idx) return sum;
        return sum + fn;
      }, 0);
      const fp = confusionMatrix.reduce((sum, row, idx) => {
        if (idx === i) return sum;
        return sum + row[i];
      }, 0);
      precision = tp / (tp + fp);
      if (tp + fn === 0) {
        recall = 0;
        f1Score = 0;
      } else {
        recall = tp / (tp + fn);
        f1Score = (2 * (precision * recall)) / (precision + recall);
      }
      baseMetrics[i].precision = precision;
      averageMetrics.precision += precision;
      baseMetrics[i].recall = recall;
      averageMetrics.recall += recall;
      baseMetrics[i].f1Score = f1Score;
      averageMetrics.f1Score += f1Score;
    }

    averageMetrics.f1Score /= nClasses;
    averageMetrics.precision /= nClasses;
    averageMetrics.recall /= nClasses;
  }

  return { precision: precision, recall: recall, f1Score: f1Score };
};
