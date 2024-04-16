import React, { ReactElement, createContext, useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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

export const CustomTabSwitcher = ({
  children,
  childClassName,
  labels,
  disabledTabs,
  secondaryEffect,
  onTabClose,
}: {
  children: JSX.Element[];
  childClassName: string;
  labels: string[];
  disabledTabs?: number[];
  secondaryEffect?: (tab: string) => void;
  onTabClose: (item: string, newItem?: string) => void;
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
    setTabIndex(newValue);
    secondaryEffect && secondaryEffect(labels[newValue]);
  };

  const handleTabDeletion = (event: React.MouseEvent, label: string) => {
    event.stopPropagation();
    if (labels.length <= 1) {
      return;
    }

    const labelIndex = labels.findIndex((el) => el === label);

    if (labelIndex === tabIndex) {
      if (labelIndex === labels.length - 1) {
        setTabIndex(labelIndex - 1);
        onTabClose(label, labels[labelIndex - 1]);
      } else {
        onTabClose(label, labels[labelIndex + 1]);
      }
    } else {
      if (labelIndex < tabIndex) {
        setTabIndex(tabIndex - 1);
      } else {
      }
      onTabClose(label);
    }
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
                  label={
                    <Box
                      width={"100%"}
                      display="flex"
                      flexDirection="row"
                      justifyContent="center"
                      sx={{
                        "& .MuiSvgIcon-root": {
                          visibility: "hidden",
                        },
                        ":hover": {
                          "& .MuiSvgIcon-root": {
                            visibility: "visible",
                          },
                        },
                      }}
                    >
                      <Typography variant="body2">{label}</Typography>

                      <CloseIcon
                        fontSize="small"
                        sx={{ position: "absolute", right: "10px", p: 0 }}
                        onClick={(event) => handleTabDeletion(event, label)}
                      />
                    </Box>
                  }
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
