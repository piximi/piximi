import React, { ReactElement, useState } from "react";

import { Badge, Drawer, ListItem, ListItemIcon, useTheme } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { FilterOptions, InformationOptions } from "./tool-options-drawer";
import { useTranslation } from "hooks";
import { ToolOptionsDrawer } from "./tool-options-drawer/ToolOptionsDrawer/ToolOptionsDrawer";
import { AppBarOffset } from "components/styled-components";
import { dimensions } from "utils/common/constants";
import { useSelector } from "react-redux";
import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";
import { selectActiveFilteredStateHasFilters } from "store/project/selectors";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options: ReactElement;
  hotkey: string;
};

const imageTools: Record<string, OperationType> = {
  filters: {
    icon: (color) => <FilterAltOutlinedIcon sx={{ color: color }} />,
    name: "filters",
    description: "-",
    options: <FilterOptions />,
    hotkey: "F",
  },
  information: {
    icon: (color) => <InfoOutlinedIcon sx={{ color: color }} />,
    name: "information",
    description: "-",
    options: <InformationOptions />,
    hotkey: "I",
  },
};

//TODO: Icon button
export const ImageToolDrawer = () => {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<string>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const filtersExist = useSelector(selectActiveFilteredStateHasFilters);
  const t = useTranslation();

  const handleSelectTool = (toolName: string) => {
    if (activeTool === undefined) {
      setActiveTool(toolName);
      setIsOpen(true);
    } else {
      if (toolName === activeTool) {
        setActiveTool(undefined);
        setIsOpen(false);
      } else {
        setActiveTool(toolName);
      }
    }
  };

  return (
    <>
      {activeTool && (
        <ToolOptionsDrawer
          optionsVisibility={isOpen}
          toolType={imageTools[activeTool]}
        />
      )}

      <Drawer
        anchor="right"
        sx={(theme) => ({
          flexShrink: 0,
          whiteSpace: "nowrap",
          "& > .MuiDrawer-paper": {
            zIndex: 99,
            width: dimensions.toolDrawerWidth + "px",
            pt: theme.spacing(1),
          },
        })}
        variant="permanent"
        open={isOpen}
      >
        <AppBarOffset />
        {Object.values(imageTools).map((tool) => {
          return (
            <TooltipCard
              key={`tool-drawer-${tool.name}`}
              description={
                <ToolHotkeyTitle toolName={t(tool.name.toLocaleUpperCase())} />
              }
            >
              <ListItem
                button
                onClick={() => {
                  handleSelectTool(tool.name);
                }}
              >
                <ListItemIcon>
                  {tool.name === "filters" ? (
                    <Badge
                      color="primary"
                      variant="dot"
                      invisible={!filtersExist}
                    >
                      {tool.icon(
                        activeTool === tool.name
                          ? theme.palette.primary.dark
                          : theme.palette.grey[400]
                      )}
                    </Badge>
                  ) : (
                    tool.icon(
                      activeTool === tool.name
                        ? theme.palette.primary.dark
                        : theme.palette.grey[400]
                    )
                  )}
                </ListItemIcon>
              </ListItem>
            </TooltipCard>
          );
        })}
      </Drawer>
    </>
  );
};
