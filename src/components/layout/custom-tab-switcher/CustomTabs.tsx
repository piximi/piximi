import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Box, Divider, IconButton, Tab, Tabs, Typography } from "@mui/material";

import {
  Delete as DeleteIcon,
  Minimize as MinimizeIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { TextFieldWithBlur } from "components/inputs";
import {
  BasicTabPanel,
  ControlledTabPanel,
  SlidingTabPanel,
} from "./TabPanels";

import {
  CommonTabsProps,
  EditableTabsProps,
  ExtendableTabsProps,
} from "./props";
import { useMobileView } from "hooks";

const TabContext = createContext<number>(0);

export function CustomTabs(props: CommonTabsProps): JSX.Element;
export function CustomTabs(
  props: CommonTabsProps & ExtendableTabsProps,
): JSX.Element;

export function CustomTabs(
  props: CommonTabsProps & EditableTabsProps,
): JSX.Element;
export function CustomTabs(
  props: CommonTabsProps & EditableTabsProps & ExtendableTabsProps,
): JSX.Element;

export function CustomTabs(
  props: CommonTabsProps &
    Partial<ExtendableTabsProps> &
    Partial<EditableTabsProps>,
): JSX.Element {
  const {
    children,
    childClassName = "custom-tabs",
    labels,
    disabledTabs,
    secondaryEffect,
    activeLabel,
    transition = "basic",
    extendable,
    handleTabClose,
    handleNew,
    editable,
    handleTabEdit,
    renderLabel,
    handleTabMin,
    persistentTabs,
  } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const isMobile = useMobileView();

  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number,
  ) => {
    setTabIndex(newValue);
    secondaryEffect && secondaryEffect(labels[newValue]);
  };

  const handleTabDeletion = useMemo(
    () =>
      (event: React.MouseEvent, label: string, action: "delete" | "hide") => {
        if (!handleTabClose) return;
        event.stopPropagation();
        if (labels.length <= 1) {
          return;
        }

        const labelIndex = labels.findIndex((el) => el === label);

        if (labelIndex === tabIndex) {
          if (labelIndex === labels.length - 1) {
            setTabIndex(labelIndex - 1);
            action === "hide" && handleTabMin
              ? handleTabMin(label, labels[labelIndex - 1])
              : handleTabClose(label, labels[labelIndex - 1]);
          } else {
            action === "hide" && handleTabMin
              ? handleTabMin(label, labels[labelIndex + 1])
              : handleTabClose(label, labels[labelIndex + 1]);
          }
        } else {
          if (labelIndex < tabIndex) {
            setTabIndex(tabIndex - 1);
          }
          action === "hide" && handleTabMin
            ? handleTabMin(label)
            : handleTabClose(label);
        }
      },
    [handleTabClose, labels, tabIndex, handleTabMin],
  );

  const addClass = (children: JSX.Element[]) => {
    const StyledChildren = React.Children.map(children!, (child) => {
      return (
        <div className={childClassName}>
          {React.cloneElement(child, {
            className: ` ${childClassName}`,
          })}
        </div>
      );
    }).filter((_, idx) => !disabledTabs?.includes(idx));
    return transition === "basic" ? StyledChildren : <>{StyledChildren}</>;
  };

  const renderTabLabel = useCallback(
    (label: string) => {
      return extendable ? (
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
          {isEditing && labels.findIndex((l) => l === label) === tabIndex ? (
            <TextFieldWithBlur
              value={renderLabel ? renderLabel(label) : label}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleTabEdit!(label, event.target.value);
                //setIsEditing(false);
              }}
              onBlur={() => setIsEditing(false)}
              size="small"
              autoFocus
              slotProps={{
                htmlInput: { style: { paddingBlock: 0 } },
              }}
            />
          ) : (
            <Typography variant="body2">
              {renderLabel ? renderLabel(label) : label}
            </Typography>
          )}

          <Box
            display="flex"
            flexDirection="row"
            flexShrink={1}
            position="absolute"
            right="10px"
          >
            {editable && (
              <EditIcon
                data-help={props.tabHelp?.edit}
                fontSize="small"
                sx={{ p: 0 }}
                onClick={() => setIsEditing(true)}
              />
            )}
            {handleTabMin && (
              <MinimizeIcon
                data-help={props.tabHelp?.minimize}
                fontSize="small"
                sx={{ p: 0 }}
                onClick={(event) => handleTabDeletion(event, label, "hide")}
              />
            )}
            {!(persistentTabs && persistentTabs.includes(label)) && (
              <DeleteIcon
                data-help={props.tabHelp?.delete}
                fontSize="small"
                sx={{ p: 0 }}
                onClick={(event) => handleTabDeletion(event, label, "delete")}
              />
            )}
          </Box>
        </Box>
      ) : (
        <Box
          width={"100%"}
          display="flex"
          flexDirection="row"
          justifyContent="center"
        >
          <Typography variant="body2">
            {renderLabel ? renderLabel(label) : label}
          </Typography>
        </Box>
      );
    },
    [
      handleTabDeletion,
      extendable,
      editable,
      handleTabEdit,
      isEditing,
      labels,
      tabIndex,
      renderLabel,
      handleTabMin,
      persistentTabs,
    ],
  );

  useEffect(() => {
    if (activeLabel) {
      setTabIndex(labels.findIndex((label) => label === activeLabel));
    }
  }, [labels, activeLabel]);
  useEffect(() => {
    if (isMobile) {
      setTabIndex(0);
    }
  }, [isMobile]);

  return (
    <TabContext.Provider value={tabIndex}>
      <Box
        sx={() => ({
          width: "100%",
          flexGrow: 1,
          height: "100%",
        })}
      >
        <Box
          display="flex"
          flexDirection="row"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tabs
            data-help={props.tabHelp?.tabBar}
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
                  label={renderTabLabel(label)}
                  disabled={disabledTabs && disabledTabs.includes(idx)}
                />
              ) : (
                label
              );
            })}
          </Tabs>
          {extendable && (
            <>
              <Divider orientation="vertical" />
              <Box display="flex" flexShrink={1} justifySelf="flex-end">
                <IconButton
                  data-help={props.tabHelp?.create}
                  onClick={handleNew}
                  disableRipple
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
        {transition === "sliding" && (
          <SlidingTabPanel
            value={tabIndex}
            index={0}
            childClassName={childClassName}
          >
            {addClass(children as JSX.Element[])}
          </SlidingTabPanel>
        )}
        {transition === "basic" &&
          (children as JSX.Element[]).map((child, idx) => (
            <BasicTabPanel
              key={`${childClassName}-${idx}`}
              value={tabIndex}
              index={idx}
              childClassName={childClassName}
            >
              {child}
            </BasicTabPanel>
          ))}
        {transition === "controlled" && (
          <ControlledTabPanel childClassName={childClassName}>
            <div className={childClassName}>{children}</div>
          </ControlledTabPanel>
        )}
      </Box>
    </TabContext.Provider>
  );
}
