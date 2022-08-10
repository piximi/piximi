import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { TrainingHistoryPlot } from "./TrainingHistoryPlot";

export default {
  title: "Training history plot",
  component: TrainingHistoryPlot,
} as ComponentMeta<typeof TrainingHistoryPlot>;

const Template: ComponentStory<typeof TrainingHistoryPlot> = (args) => (
  <TrainingHistoryPlot {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  metric: "accuracy",
  trainingValues: [
    { x: 1, y: 0.27777 },
    { x: 2, y: 0.3333 },
    { x: 3, y: 0.5111 },
    { x: 4, y: 0.45 },
  ],
  validationValues: [
    { x: 1, y: 0.15 },
    { x: 2, y: 0.35 },
    { x: 3, y: 0.65 },
    { x: 4, y: 0.8 },
  ],
};
