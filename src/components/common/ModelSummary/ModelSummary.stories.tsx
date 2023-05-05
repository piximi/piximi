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
import { LayersModel } from "@tensorflow/tfjs";

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
<<<<<<< HEAD
// TODO - segmenter: replace with Model
Primary.args = { loadedModel: simpleCNN._model! as LayersModel };
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)
Primary.args = { compiledModel: simpleCNN };
=======
Primary.args = { loadedModel: simpleCNN };
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)
