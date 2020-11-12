import React, { ComponentProps } from "react";
import { IdentifyingObjectsSnackbar } from "./IdentifyingObjectsSnackbar";
import { Meta, Story } from "@storybook/react/types-6-0";

export default {
  component: IdentifyingObjectsSnackbar,
  title: "Components/IdentifyingObjectsSnackbar",
} as Meta;

const Template: Story<ComponentProps<typeof IdentifyingObjectsSnackbar>> = (
  args
) => <IdentifyingObjectsSnackbar {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClose: () => {},
  open: true,
};
