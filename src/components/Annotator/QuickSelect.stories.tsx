import React, { ComponentProps } from "react";
import { QuickSelect } from "./QuickSelect";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Image } from "../../types/Image";

export default {
  component: QuickSelect,
  title: "Components/QuickSelect",
} as Meta;

const Template: Story<ComponentProps<typeof QuickSelect>> = (args) => (
  <QuickSelect {...args} />
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
  image: { data: new Uint8Array(512 * 512), bytes: 4, width: 512, height: 512 },
};
