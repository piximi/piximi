import React, { ComponentProps } from "react";
import { TrainingClassifierSnackbar } from "./TrainingClassifierSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: TrainingClassifierSnackbar,
  title: "Components/TrainingClassifierSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof TrainingClassifierSnackbar>> = (
  args
) => <TrainingClassifierSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
