// ignore-no-logs
import type { Meta, StoryObj } from "@storybook/react";
import { BaseHorizCard } from "./BaseHorizCard";

const meta: Meta<typeof BaseHorizCard> = {
  title: "Common/BaseHorizCard",
  component: BaseHorizCard,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof BaseHorizCard>;

export const Default: Story = {
  args: {
    title: "List Item",
    description: "This is a custom card",
    action: () => {
      console.log("I was clicked");
    },
    source: { sourceUrl: "piximiisgreat.biz", sourceName: "Piximi is Great" },
    license: {
      licenseUrl: "Licence.com",
      licenseName: "License",
    },
  },
};
