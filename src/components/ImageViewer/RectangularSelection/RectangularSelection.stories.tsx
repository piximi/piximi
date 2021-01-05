import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../../types/Image";
import { RectangularSelection } from "./RectangularSelection";

export default {
  component: RectangularSelection,
  title: "Components/ImageViewer/RectangularSelection",
} as Meta;

const Template: Story<ComponentProps<typeof RectangularSelection>> = (args) => (
  <RectangularSelection {...args} />
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
