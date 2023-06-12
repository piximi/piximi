import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ModelSummaryTable } from "../styled-components/ModelSummary";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { Shape } from "types/Shape";
import {
  CompileOptions,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "types";

export default {
  title: "Model summary table",
  component: ModelSummaryTable,
} as ComponentMeta<typeof ModelSummaryTable>;

const inputShape: Shape = {
  planes: 1,
  channels: 3,
  height: 28,
  width: 28,
};
const compileOptions: CompileOptions = {
  learningRate: 0.001,
  lossFunction: LossFunction.MeanSquaredError,
  metrics: [Metric.CategoricalAccuracy],
  optimizationAlgorithm: OptimizationAlgorithm.Adadelta,
};

const simpleCNN = new SimpleCNN();
simpleCNN.loadModel({
  inputShape,
  numClasses: 10,
  randomizeWeights: false,
  compileOptions,
});

const Template: ComponentStory<typeof ModelSummaryTable> = (args) => (
  <ModelSummaryTable {...args} />
);

export const Primary = Template.bind({});
Primary.args = { model: simpleCNN };
