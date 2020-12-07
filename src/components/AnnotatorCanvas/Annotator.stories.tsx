import React, { ComponentProps } from "react";
import { Annotator } from "./Annotator";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../types/Image";

export default {
  component: Annotator,
  title: "Components/Annotator",
} as Meta;

const Template: Story<ComponentProps<typeof Annotator>> = (args) => (
  <Annotator {...args} />
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
  image: image,
};
