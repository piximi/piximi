import React, { ReactElement, createContext, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

const TabContext = createContext<number>(0);
interface TabPanelProps {
  children?: ReactElement;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      id={`model-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
      style={{
        position: "relative",
        left: -1 * value * 100 + "%",
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      }}
    >
      {children}
    </div>
  );
}

export const NewCustomTabSwitcher = ({
  children,
  childClassName,
  labels,
  disabledTabs,
  secondaryEffect,
}: {
  children: JSX.Element[];
  childClassName: string;
  labels: string[];
  disabledTabs?: number[];
  secondaryEffect?: (tab: string) => void;
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
    setTabIndex(newValue);
    secondaryEffect && secondaryEffect(labels[newValue]);
  };

  const addClass = (children: JSX.Element[]) => {
    const StyledChildren = React.Children.map(children!, (child) => {
      return (
        <div className={childClassName}>
          {React.cloneElement(child, {
            className: ` ${childClassName}`,
          })}
        </div>
      );
    }).filter((child, idx) => !disabledTabs?.includes(idx));
    return <>{StyledChildren}</>;
  };

  return (
    <TabContext.Provider value={tabIndex}>
      <Box
        sx={(theme) => ({
          width: "100%",
          flexGrow: 1,
        })}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="tabbed-view"
            variant="fullWidth"
          >
            {labels?.map((label, idx) => {
              return typeof label === "string" ? (
                <Tab
                  key={`Tab-${childClassName}-tab-${idx}`}
                  label={label}
                  disabled={disabledTabs && disabledTabs.includes(idx)}
                />
              ) : (
                label
              );
            })}
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <Box
            display="flex"
            sx={(theme) => ({
              minWidth: "100%",
              maxHeight: "calc(100vh - 60px)",

              ["& > ." + childClassName]: {
                minWidth: "100%",
                maxWidth: "100%",
              },
            })}
          >
            {addClass(children)}
          </Box>
        </TabPanel>
      </Box>
    </TabContext.Provider>
  );
};
