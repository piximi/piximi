// ignore-no-logs
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmationDialogSHK } from "./ConfirmationDialogSHK";

const meta: Meta<typeof ConfirmationDialogSHK> = {
  title: "Common/ConfirmationDialog",
  component: ConfirmationDialogSHK,
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
type Story = StoryObj<typeof ConfirmationDialogSHK>;

export const Default: Story = {
  args: {
    title: "Confirmation Dialog",
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
    title: "Confirmation Dialog",
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
    title: "Confirmation Dialog",
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
