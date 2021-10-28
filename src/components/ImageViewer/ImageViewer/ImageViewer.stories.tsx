import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { ImageType } from "../../../annotator/types/ImageType";
import { ImageViewer } from "./ImageViewer";
import src from "../../../annotator/images/cell-painting.png";

export default {
  component: ImageViewer,
  title: "Components/ImageViewer/ImageViewer",
} as Meta;

const Template: Story<ComponentProps<typeof ImageViewer>> = (args) => (
  <ImageViewer {...args} />
);

export const Default = Template.bind({});

const image: ImageType = {
  avatar: "",
  id: "",
  annotations: [],
  name: "foo.png",
  shape: {
    channels: 3,
    frames: 1,
    height: 512,
    planes: 1,
    width: 512,
  },
  originalSrc: src,
  src: src,
};

Default.args = {
  image: image,
};
