import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../../types/Image";
import { EllipticalSelection } from "./EllipticalSelection";

export default {
  component: EllipticalSelection,
  title: "Components/ImageViewer/EllipticalSelection",
} as Meta;

const Template: Story<ComponentProps<typeof EllipticalSelection>> = (args) => (
  <EllipticalSelection {...args} />
);

export const Default = Template.bind({});

const image: Image = {
  id: "",
  instances: [],
  name: "foo.png",
  shape: { c: 512, channels: 3, r: 512 },
  src: "https://picsum.photos/id/237/512/512",
};

Default.args = {
  data: image,
};
