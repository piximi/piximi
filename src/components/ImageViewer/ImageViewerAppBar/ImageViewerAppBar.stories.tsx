import React, { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react/types-6-0";
import { ImageViewerAppBar } from "./ImageViewerAppBar";

export default {
  component: ImageViewerAppBar,
  title: "Components/ImageViewer/ImageViewerAppBar",
} as Meta;

const Template: Story<ComponentProps<typeof ImageViewerAppBar>> = () => (
  <ImageViewerAppBar />
);

export const Default = Template.bind({});

Default.args = {};
