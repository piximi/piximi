import React from "react";
import { TwoDataPlot } from "../data-display";

const y: {
  x: number;
  y: number;
}[] = [];
const TrainingPlots = () => {
  return (
    <div>
      <TwoDataPlot
        title="Training History - Accuracy per Epoch"
        yLabel="Accuracy"
        xLabel="Epoch"
        yData1={y}
        id1="Accuracy"
        yData2={y}
        id2="Validation Accuracy"
      />

      <TwoDataPlot
        title="Training History - Loss per Epoch"
        yLabel="Loss"
        xLabel="Epoch"
        yData1={y}
        id1="Loss"
        yData2={y}
        id2="Validation Loss"
        dynamicYRange={true}
      />
    </div>
  );
};

export default TrainingPlots;
