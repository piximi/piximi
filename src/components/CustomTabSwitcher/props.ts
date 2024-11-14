import { TabProps } from "@mui/material";

export type BasicTabProps = { label: string } & Omit<TabProps, "label">;

export interface CommonTabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
  childClassName: string;
}
export type CommonTabsProps = {
  children: JSX.Element[] | JSX.Element;
  renderLabel?: (label: string) => string;
  childClassName: string;
  labels: string[];
  disabledTabs?: number[];
  secondaryEffect?: (tab: string) => void;
  activeLabel?: string;
  transition?: "basic" | "sliding" | "controlled";
};

export type ExtendableTabsProps = {
  extendable: true;
  handleTabClose: (item: string, newItem?: string) => void;
  handleNew: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  handleTabMin?: (item: string, newItem?: string) => void;
};

export type EditableTabsProps = {
  editable: true;
  handleTabEdit: (label: string, newLabel: string) => void;
};

export type GenericTabsProps = CommonTabsProps;
