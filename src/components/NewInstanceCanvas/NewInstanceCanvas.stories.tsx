import React, { ComponentProps } from "react";
import { NewInstanceCanvas } from "./NewInstanceCanvas";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../types/Image";

export default {
  component: NewInstanceCanvas,
  title: "Components/NewInstanceCanvas",
} as Meta;

const Template: Story<ComponentProps<typeof NewInstanceCanvas>> = (args) => (
  <NewInstanceCanvas {...args} />
);

export const Default = Template.bind({});

const image: Image = {
  id: "",
  instances: [],
  name: "foo.png",
  src: "https://picsum.photos/id/237/512/512",
};

Default.args = {
  image: image,
};
