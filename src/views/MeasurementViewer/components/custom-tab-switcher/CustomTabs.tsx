import { useCallback, useMemo, useState } from "react";

import { Box, Divider, IconButton, Tab, Tabs, Typography } from "@mui/material";
import {
  Delete as DeleteIcon,
  Minimize as MinimizeIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { TextFieldWithBlur } from "components/inputs";

import { BasicTabPanel, ControlledTabPanel } from "./TabPanels";

import type React from "react";

import type {
  CommonTabsProps,
  EditableTabsProps,
  ExtendableTabsProps,
} from "./props";

export function CustomTabs(props: CommonTabsProps): React.JSX.Element;
export function CustomTabs(
  props: CommonTabsProps & ExtendableTabsProps,
): React.JSX.Element;

export function CustomTabs(
  props: CommonTabsProps & EditableTabsProps,
): React.JSX.Element;
export function CustomTabs(
  props: CommonTabsProps & EditableTabsProps & ExtendableTabsProps,
): React.JSX.Element;

export function CustomTabs(
  props: CommonTabsProps &
    Partial<ExtendableTabsProps> &
    Partial<EditableTabsProps>,
): React.JSX.Element {
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
    tabHelp,
  } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const controlled = activeLabel !== undefined;
  const activeIndex = controlled
    ? Math.max(0, labels.indexOf(activeLabel))
    : tabIndex;

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

        if (labelIndex === activeIndex) {
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
          if (labelIndex < activeIndex) {
            setTabIndex(activeIndex - 1);
          }
          action === "hide" && handleTabMin
            ? handleTabMin(label)
            : handleTabClose(label);
        }
      },
    [handleTabClose, labels, activeIndex, handleTabMin],
  );

  const renderTabLabel = useCallback(
    (label: string) => {
      return (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",

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
          {editable &&
          isEditing &&
          labels.findIndex((l) => l === label) === activeIndex ? (
            <TextFieldWithBlur
              value={renderLabel ? renderLabel(label) : label}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleTabEdit!(label, event.target.value);
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

          {(editable || extendable) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexShrink: 1,
                position: "absolute",
                right: "10px",
              }}
            >
              {editable && (
                <EditIcon
                  data-help={tabHelp?.edit}
                  fontSize="small"
                  sx={{ p: 0 }}
                  onClick={() => setIsEditing(true)}
                />
              )}
              {handleTabMin && (
                <MinimizeIcon
                  data-help={tabHelp?.minimize}
                  fontSize="small"
                  sx={{ p: 0 }}
                  onClick={(event) => handleTabDeletion(event, label, "hide")}
                />
              )}
              {!(persistentTabs && persistentTabs.includes(label)) && (
                <DeleteIcon
                  data-help={tabHelp?.delete}
                  fontSize="small"
                  sx={{ p: 0 }}
                  onClick={(event) => handleTabDeletion(event, label, "delete")}
                />
              )}
            </Box>
          )}
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
      activeIndex,
      renderLabel,
      handleTabMin,
      persistentTabs,
      tabHelp,
    ],
  );

  return (
    <Box
      sx={() => ({
        width: "100%",
        flexGrow: 1,
        height: "100%",
      })}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          data-help={props.tabHelp?.tabBar}
          value={activeIndex}
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
        {handleNew && (
          <>
            <Divider orientation="vertical" />
            <Box
              sx={{
                display: "flex",
                flexShrink: 1,
                justifySelf: "flex-end",
              }}
            >
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

      {transition === "basic" &&
        (children as React.JSX.Element[]).map((child, idx) => (
          <BasicTabPanel
            key={`${childClassName}-${idx}`}
            value={activeIndex}
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
  );
}
