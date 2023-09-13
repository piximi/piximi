import type { Meta, StoryObj } from "@storybook/react";
import { CustomDialog } from "./CustomDialog";

const meta: Meta<typeof CustomDialog> = {
  title: "Common/CustomDialog",
  component: CustomDialog,
  tags: ["autodocs"],
  args: {
    title: "Test",
    open: false,
  },
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
type Story = StoryObj<typeof CustomDialog>;

export const Default: Story = {
  args: {
    title: "Test",
    open: true,
    content: "This is a test dialog",
    onClose: () => {},
  },
};
