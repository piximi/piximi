import React, { ComponentProps } from "react";
import { LoadingClassifierSnackbar } from "./LoadingClassifierSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: LoadingClassifierSnackbar,
  title: "Components/LoadingClassifierSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof LoadingClassifierSnackbar>> = (
  args
) => <LoadingClassifierSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
