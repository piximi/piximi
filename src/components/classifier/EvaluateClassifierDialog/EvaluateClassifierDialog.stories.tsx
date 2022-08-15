import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

export default {
  title: "Evaluate Dialog",
  component: EvaluateClassifierDialog,
} as ComponentMeta<typeof EvaluateClassifierDialog>;

const Template: ComponentStory<typeof EvaluateClassifierDialog> = (args) => (
  <EvaluateClassifierDialog {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  closeDialog: () => {
    return;
  },
  openedDialog: true,
  confusionMatrix: [
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [0, 3, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 1, 0, 0, 1, 1, 0],
  ],
  classNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  accuracy: 0.5,
  crossEntropy: 0.5,
  precision: 0.4,
  recall: 0.6,
};

export const Secondary = Template.bind({});
Secondary.args = {
  closeDialog: () => {
    return;
  },
  openedDialog: true,
  confusionMatrix: [
    [2, 1],
    [0, 3],
  ],
  classNames: ["negative (something)", "positive (something)"],
  accuracy: 0.5,
  crossEntropy: 0.5,
  precision: 0.4,
  recall: 0.6,
};
