import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../../types/Image";
import { ObjectSelection } from "./ObjectSelection";
import { Category } from "../../../types/Category";

export default {
  component: ObjectSelection,
  title: "Components/ImageViewer/ObjectSelection",
} as Meta;

const Template: Story<ComponentProps<typeof ObjectSelection>> = (args) => (
  <ObjectSelection {...args} />
);

export const Default = Template.bind({});

const category: Category = {
  color: "#FF0000",
  id: "13657a69-3b1b-4e8d-b124-e04fd0996070",
  name: "foo",
  visible: true,
};

const image: Image = {
  id: "fc2580d0-1068-444e-ad5d-7528c790e4c9",
  instances: [],
  name: "foo.png",
  shape: { c: 512, channels: 3, r: 512 },
  src: "https://picsum.photos/id/237/512/512",
};

Default.args = {
  category: category,
  data: image,
};
