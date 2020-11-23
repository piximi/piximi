import React, { ComponentProps } from "react";
import { ImageDialogAppBar } from "./ImageDialogAppBar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: ImageDialogAppBar,
  title: "Components/CompilingClassifierSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof ImageDialogAppBar>> = (args) => (
  <ImageDialogAppBar {...args} />
);

export const Default = Template.bind({});

Default.args = {};
