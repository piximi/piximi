// ignore-no-logs
import type { Meta, StoryObj } from "@storybook/react";
import { IncrementalSlider } from "./IncrementalSlider";

const meta: Meta<typeof IncrementalSlider> = {
  title: "Components/IncrementalSlider",
  component: IncrementalSlider,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof IncrementalSlider>;

export const Default: Story = {
  args: {
    min: 1,
    max: 10,
    step: 1,
    callback: (value: number) => {
      console.log("New Value: ", value);
    },
  },
};
