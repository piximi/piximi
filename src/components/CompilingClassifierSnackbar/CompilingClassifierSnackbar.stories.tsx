import React, { ComponentProps } from "react";
import { CompilingClassifierSnackbar } from "./CompilingClassifierSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: CompilingClassifierSnackbar,
  title: "Components/CompilingClassifierSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof CompilingClassifierSnackbar>> = (
  args
) => <CompilingClassifierSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
