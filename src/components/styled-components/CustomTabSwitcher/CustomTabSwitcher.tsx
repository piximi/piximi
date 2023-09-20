import React, { ReactElement, createContext, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

export const TabContext = createContext<number>(0);
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

export const CustomTabSwitcher = ({
  children,
  childClassName,
  label1,
  label2,
  disabledTabs,
  secondaryEffect,
}: {
  children: JSX.Element[];
  childClassName: string;
  label1: string;
  label2: string;
  disabledTabs?: number[];
  secondaryEffect?: (index: number) => void;
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
    setTabIndex(newValue);
    secondaryEffect && secondaryEffect(newValue);
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
    });
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
            <Tab
              label={label1}
              disabled={disabledTabs && disabledTabs.includes(0)}
            />
            <Tab
              label={label2}
              disabled={disabledTabs && disabledTabs.includes(1)}
            />
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
