import React, { ReactElement, useState } from "react";

import { Badge, Drawer, ListItem, ListItemIcon, useTheme } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SortIcon from "@mui/icons-material/Sort";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import LabelIcon from "@mui/icons-material/Label";
import { FileList } from "components/lists";
import { CategoriesList } from "components/lists";

import { FilterOptions, InformationOptions } from "./tool-options-drawer";
import { useMobileView, useTranslation } from "hooks";
import { ToolOptionsDrawer } from "./tool-options-drawer/ToolOptionsDrawer/ToolOptionsDrawer";
import { AppBarOffset, SortSelection } from "components/styled-components";
import { dimensions } from "utils/common/constants";
import { useSelector } from "react-redux";
import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";
import { selectActiveFilteredStateHasFilters } from "store/project/selectors";
import { ModelTaskSection } from "../ProjectDrawer/ModelTaskSection";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options: ReactElement;
  hotkey: string;
  mobile?: boolean;
};

const imageTools: Record<string, OperationType> = {
  fileIO: {
    icon: (color) => <FolderOpenIcon sx={{ color }} />,
    name: "fileIO",
    description: "-",
    options: <FileList />,
    hotkey: "O",
    mobile: true,
  },
  sort: {
    icon: (color) => <SortIcon sx={{ color }} />,
    name: "sort",
    description: "-",
    options: <SortSelection />,
    hotkey: "S",
    mobile: true,
  },
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
  learning: {
    icon: (color) => <ScatterPlotIcon sx={{ color }} />,
    name: "learning",
    description: "-",
    options: <ModelTaskSection />,
    hotkey: "L",
    mobile: true,
  },
  categories: {
    icon: (color) => <LabelIcon sx={{ color }} />,
    name: "categories",
    description: "-",
    options: <CategoriesList />,
    hotkey: "C",
    mobile: true,
  },
};

//TODO: Icon button
export const ImageToolDrawer = () => {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<string>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const filtersExist = useSelector(selectActiveFilteredStateHasFilters);
  const t = useTranslation();
  const isMobile = useMobileView();

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
      {activeTool && (!imageTools[activeTool].mobile || isMobile) && (
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
          return !tool.mobile || isMobile ? (
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
          ) : (
            <React.Fragment key={`tool-drawer-${tool.name}`}></React.Fragment>
          );
        })}
      </Drawer>
    </>
  );
};
