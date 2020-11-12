import React, { ComponentProps } from "react";
import { EvaluatingClassifierSnackbar } from "./EvaluatingClassifierSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: EvaluatingClassifierSnackbar,
  title: "Components/EvaluatingClassifierSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof EvaluatingClassifierSnackbar>> = (
  args
) => <EvaluatingClassifierSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
