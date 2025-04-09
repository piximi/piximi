import React from "react";
import { useClassifierHistory } from "views/ProjectViewer/contexts/ClassifierHistoryProvider";
import { TwoDataPlot } from "../data-display";

const y: {
  x: number;
  y: number;
}[] = [];
const TrainingPlots = () => {
  const { modelHistory } = useClassifierHistory();
  return (
    <div>
      <TwoDataPlot
        title="Training History - Accuracy per Epoch"
        yLabel="Accuracy"
        xLabel="Epoch"
        yData1={modelHistory.categoricalAccuracy}
        id1="Accuracy"
        yData2={modelHistory.val_categoricalAccuracy}
        id2="Validation Accuracy"
      />

      <TwoDataPlot
        title="Training History - Loss per Epoch"
        yLabel="Loss"
        xLabel="Epoch"
        yData1={modelHistory.loss}
        id1="Loss"
        yData2={modelHistory.val_loss}
        id2="Validation Loss"
        dynamicYRange={true}
      />
    </div>
  );
};

export default TrainingPlots;
