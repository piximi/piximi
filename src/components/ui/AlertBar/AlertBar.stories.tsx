import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AlertBar } from "./AlertBar";
import { AlertState } from "utils/types";
import { AlertType } from "utils/enums";

const meta: Meta<typeof AlertBar> = {
  title: "Common/AlertBar",
  component: AlertBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AlertBar>;

const errorAlert: AlertState = {
  alertType: AlertType.Error,
  name: "Test Error Alert",
  description: "This is just a test.",
  component: "Component Name",
  stackTrace: "Stack Trace",
  visible: true,
};

const warningAlert: AlertState = {
  alertType: AlertType.Warning,
  name: "Test Warning Alert",
  description: "This is just a test.",
  component: "Component Name",
  stackTrace: "Stack Trace",
  visible: true,
};

const infoAlert: AlertState = {
  alertType: AlertType.Info,
  name: "Test Info Alert",
  description: "This is just a test.",
  component: "Component Name",
  stackTrace: "Stack Trace",
  visible: true,
};

export const Error: Story = {
  render: () => <AlertBar alertState={errorAlert} />,
};

export const Warning: Story = {
  render: () => <AlertBar alertState={warningAlert} />,
};

export const Info: Story = {
  render: () => <AlertBar alertState={infoAlert} />,
};
