import type { Meta, StoryObj } from "@storybook/react";
import { CollapsibleListItem } from "./CollapsibleListItem";
import { List } from "@mui/material";

const meta: Meta<typeof CollapsibleListItem> = {
  title: "Common/CollapsibleListItem",
  component: CollapsibleListItem,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CollapsibleListItem>;

export const Default: Story = {
  args: {
    primaryText: "List Item",
  },
  decorators: [
    (Story) => (
      <List sx={{ width: 300 }}>
        <Story />
      </List>
    ),
  ],
};
