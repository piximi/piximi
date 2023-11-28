import React, { ReactElement, useState } from "react";

import { Badge, Drawer, ListItem, ListItemIcon, useTheme } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import { FilterOptions } from "./tool-options-drawer/FilterOptions";
import { useTranslation } from "hooks";
import { ToolOptionsDrawer } from "./tool-options-drawer/ToolOptionsDrawer/ToolOptionsDrawer";
import { AppBarOffset } from "components/styled-components";
import { dimensions } from "utils/common";
import { useSelector } from "react-redux";
import { selectFilteredState } from "store/slices/project";
import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";

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
};

//TODO: Icon button
export const ImageToolDrawer = () => {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<string>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const filteredState = useSelector(selectFilteredState);
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
        <TooltipCard description={<ToolHotkeyTitle toolName={t("Filters")} />}>
          <ListItem
            button
            onClick={() => {
              handleSelectTool("filters");
            }}
          >
            <ListItemIcon>
              <Badge
                color="primary"
                variant="dot"
                invisible={
                  !(
                    filteredState.hasAnnotationFilters ||
                    filteredState.hasImageFilters
                  )
                }
              >
                <FilterAltOutlinedIcon
                  sx={{
                    color:
                      activeTool === "filters"
                        ? theme.palette.primary.dark
                        : theme.palette.grey[400],
                  }}
                />
              </Badge>
            </ListItemIcon>
          </ListItem>
        </TooltipCard>
      </Drawer>
    </>
  );
};
