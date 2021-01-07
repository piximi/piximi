import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../../types/Image";
import { QuickSelection } from "./QuickSelection";

export default {
  component: QuickSelection,
  title: "Components/ImageViewer/QuickSelection",
} as Meta;

const Template: Story<ComponentProps<typeof QuickSelection>> = (args) => (
  <QuickSelection {...args} />
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
