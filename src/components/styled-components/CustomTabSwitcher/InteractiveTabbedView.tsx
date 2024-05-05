import React, { ReactElement, createContext, useEffect, useState } from "react";
import { Box, Divider, IconButton, Tab, Tabs, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MinimizeIcon from "@mui/icons-material/Minimize";
import AddIcon from "@mui/icons-material/Add";

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

export const InteractiveTabbedView = ({
  children,
  childClassName,
  labels,
  disabledTabs,
  secondaryEffect,
  onTabClose,
  onNew,
  activeLabel,
}: {
  children: JSX.Element[];
  childClassName: string;
  labels: string[];
  disabledTabs?: number[];
  secondaryEffect?: (tab: string) => void;
  onTabClose: (
    action: "delete" | "hide",
    item: string,
    newItem?: string
  ) => void;
  onNew: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  activeLabel?: string;
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
    setTabIndex(newValue);
    secondaryEffect && secondaryEffect(labels[newValue]);
  };

  const handleTabDeletion = (
    event: React.MouseEvent,
    label: string,
    action: "delete" | "hide"
  ) => {
    event.stopPropagation();
    if (labels.length <= 1) {
      return;
    }

    const labelIndex = labels.findIndex((el) => el === label);

    if (labelIndex === tabIndex) {
      if (labelIndex === labels.length - 1) {
        setTabIndex(labelIndex - 1);
        onTabClose(action, label, labels[labelIndex - 1]);
      } else {
        onTabClose(action, label, labels[labelIndex + 1]);
      }
    } else {
      if (labelIndex < tabIndex) {
        setTabIndex(tabIndex - 1);
      } else {
      }
      onTabClose(action, label);
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

  useEffect(() => {
    if (activeLabel) {
      setTabIndex(labels.findIndex((label) => label === activeLabel));
    }
  }, [labels, activeLabel]);

  return (
    <TabContext.Provider value={tabIndex}>
      <Box
        sx={(theme) => ({
          width: "100%",
          flexGrow: 1,
        })}
      >
        <Box
          display="flex"
          flexDirection="row"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="tabbed-view"
            variant="fullWidth"
            sx={{ flexGrow: 1 }}
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
                      <Box
                        display="flex"
                        flexDirection="row"
                        flexShrink={1}
                        position="absolute"
                        right="10px"
                      >
                        <MinimizeIcon
                          fontSize="small"
                          sx={{ p: 0 }}
                          onClick={(event) =>
                            handleTabDeletion(event, label, "hide")
                          }
                        />
                        <DeleteIcon
                          fontSize="small"
                          sx={{ p: 0 }}
                          onClick={(event) =>
                            handleTabDeletion(event, label, "delete")
                          }
                        />
                      </Box>
                    </Box>
                  }
                  disabled={disabledTabs && disabledTabs.includes(idx)}
                />
              ) : (
                label
              );
            })}
          </Tabs>
          <Divider orientation="vertical" />
          <Box display="flex" flexShrink={1} justifySelf="flex-end">
            <IconButton onClick={onNew} disableRipple>
              <AddIcon />
            </IconButton>
          </Box>
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
