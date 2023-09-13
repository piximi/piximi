import type { Meta, StoryObj } from "@storybook/react";
import { DialogWithActionSHK } from "./DialogWithActionSHK";

const meta: Meta<typeof DialogWithActionSHK> = {
  title: "Common/DialogWithAction",
  component: DialogWithActionSHK,
  tags: ["autodocs"],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DialogWithActionSHK>;

export const Default: Story = {
  args: {
    title: "Dialog with Action",
    content: "Dialog content",
    onConfirm: () => {
      console.log("I'm confirmed");
    },
    onClose: () => {
      console.log("I'm closed");
    },
    isOpen: true,
  },
};

export const AltText: Story = {
  args: {
    title: "Dialog with Action",
    content: "Dialog content",
    onConfirm: () => {
      console.log("I'm confirmed");
    },
    confirmText: "Yes",
    onClose: () => {
      console.log("I'm closed");
    },
    isOpen: true,
  },
};

export const WithReject: Story = {
  args: {
    title: "Dialog with Action",
    content: "Dialog content",
    onConfirm: () => {
      console.log("I'm confirmed");
    },
    onReject: () => console.log("I'm rejected"),
    onClose: () => {
      console.log("I'm closed");
    },
    isOpen: true,
  },
};
