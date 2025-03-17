import { TabProps } from "@mui/material";
import { HelpItem } from "../HelpDrawer/HelpContent";

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
  tabHelp?: {
    tabBar: HelpItem;
    edit?: HelpItem;
    minimize?: HelpItem;
    delete?: HelpItem;
    create?: HelpItem;
  };
};

export type ExtendableTabsProps = {
  extendable: true;
  handleTabClose: (item: string, newItem?: string) => void;
  handleNew: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  handleTabMin?: (item: string, newItem?: string) => void;
  persistentTabs?: string[];
};

export type EditableTabsProps = {
  editable: true;
  handleTabEdit: (label: string, newLabel: string) => void;
};

export type GenericTabsProps = CommonTabsProps;
