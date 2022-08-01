import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import * as tensorflow from "@tensorflow/tfjs";

import { ModelSummaryTable } from "./ModelSummary";

import { createSimpleCNN } from "store/coroutines/models/simpleCNN";

import { Shape } from "types/Shape";

export default {
  title: "Model summary table",
  component: ModelSummaryTable,
} as ComponentMeta<typeof ModelSummaryTable>;

const inputShape: Shape = {
  width: 28,
  channels: 3,
  frames: 1,
  height: 28,
  planes: 1,
};

const simpleCNN = createSimpleCNN(inputShape, 10);

simpleCNN.compile({
  loss: "meanSquaredError",
  metrics: "categoricalAccuracy",
  optimizer: tensorflow.train.adadelta(0.015),
});

const Template: ComponentStory<typeof ModelSummaryTable> = (args) => (
  <ModelSummaryTable {...args} />
);

export const Primary = Template.bind({});
Primary.args = { compiledModel: simpleCNN };
