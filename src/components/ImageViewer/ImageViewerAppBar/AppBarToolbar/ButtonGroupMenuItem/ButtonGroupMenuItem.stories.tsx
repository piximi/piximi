import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { ButtonGroupMenuItem } from "./ButtonGroupMenuItem";
import { SelectionMethod } from "../../../../../types/SelectionMethod";

export default {
  component: ButtonGroupMenuItem,
  title: "Components/ImageViewer/ButtonGroupMenuItem",
} as Meta;

const Template: Story<ComponentProps<typeof ButtonGroupMenuItem>> = (args) => (
  <ButtonGroupMenuItem {...args} />
);

export const Default = Template.bind({});

const onClick = (
  event: React.MouseEvent<HTMLLIElement, MouseEvent>,
  method: SelectionMethod
) => {};

Default.args = {
  method: SelectionMethod.Lasso,
  name: "Lasso selection",
  onClick: onClick,
};
