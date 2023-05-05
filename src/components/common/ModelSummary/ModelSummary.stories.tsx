import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ModelSummaryTable } from "./ModelSummary";
import { train } from "@tensorflow/tfjs";
import { createSimpleCNN } from "store/coroutine-models/simpleCNN";
import { Shape } from "types/Shape";

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

const simpleCNN = createSimpleCNN(inputShape, 10);

simpleCNN.compile({
  loss: "meanSquaredError",
  metrics: "categoricalAccuracy",
  optimizer: train.adadelta(0.015),
});

const Template: ComponentStory<typeof ModelSummaryTable> = (args) => (
  <ModelSummaryTable {...args} />
);

export const Primary = Template.bind({});
Primary.args = { loadedModel: simpleCNN };
