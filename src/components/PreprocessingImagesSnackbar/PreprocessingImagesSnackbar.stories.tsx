import React, { ComponentProps } from "react";
import { PreprocessingImagesSnackbar } from "./PreprocessingImagesSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: PreprocessingImagesSnackbar,
  title: "Components/PreprocessingImagesSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof PreprocessingImagesSnackbar>> = (
  args
) => <PreprocessingImagesSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
