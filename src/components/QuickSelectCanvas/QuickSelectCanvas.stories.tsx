import React, { ComponentProps } from "react";
import { QuickSelectCanvas } from "./QuickSelectCanvas";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../types/Image";

export default {
  component: QuickSelectCanvas,
  title: "Components/QuickSelectCanvas",
} as Meta;

const Template: Story<ComponentProps<typeof QuickSelectCanvas>> = (args) => (
  <QuickSelectCanvas />
);

export const Default = Template.bind({});

const image: Image = {
  id: "",
  instances: [],
  name: "foo.png",
  shape: { c: 512, channels: 3, r: 512 },
  src: "https://picsum.photos/id/237/512/512",
};

Default.args = {};
