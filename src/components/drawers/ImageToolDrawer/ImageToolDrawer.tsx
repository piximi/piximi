import React, { ReactElement, useState } from "react";

import {
  Badge,
  Drawer,
  ListItem,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SortIcon from "@mui/icons-material/Sort";
import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";

import { FilterOptions } from "./tool-options-drawer/FilterOptions";
import { useTranslation } from "hooks";
import { ToolOptionsDrawer } from "./tool-options-drawer/ToolOptionsDrawer/ToolOptionsDrawer";
import {
  AppBarOffset,
  CustomTabSwitcher,
  ImageSortSelection,
} from "components/styled-components";
import { dimensions } from "utils/common";
import { useSelector } from "react-redux";
import { selectFilteredState } from "store/slices/project";
import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";
import { FileList, ClassifierList, SegmenterList } from "components/lists";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options: ReactElement;
  hotkey: string;
  show: "always" | "mobile";
};

const imageTools: Record<string, OperationType> = {
  fileIO: {
    icon: (color) => <FolderOpenIcon sx={{ color }} />,
    name: "fileIO",
    description: "-",
    options: <FileList />,
    hotkey: "O",
    show: "mobile",
  },
  sort: {
    icon: (color) => <SortIcon sx={{ color }} />,
    name: "sort",
    description: "-",
    options: <ImageSortSelection />,
    hotkey: "S",
    show: "mobile",
  },
  filters: {
    icon: (color) => <FilterAltOutlinedIcon sx={{ color: color }} />,
    name: "filters",
    description: "-",
    options: <FilterOptions />,
    hotkey: "F",
    show: "always",
  },
  learning: {
    icon: (color) => <ScatterPlotIcon sx={{ color }} />,
    name: "learning",
    description: "-",
    options: (
      <CustomTabSwitcher
        childClassName="mobile-drawer-tab"
        label1="Classifier"
        label2="Segmenter"
      >
        <ClassifierList />

        <SegmenterList />
      </CustomTabSwitcher>
    ),
    hotkey: "L",
    show: "mobile",
  },
};

//TODO: Icon button
export const ImageToolDrawer = () => {
  const theme = useTheme();
  const matchesBP = useMediaQuery(theme.breakpoints.down("md"));
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
      {activeTool &&
        (imageTools[activeTool].show === "always" || matchesBP) && (
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
          return tool.show === "always" || matchesBP ? (
            <TooltipCard
              key={`image-tools-${tool.name}`}
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
                      invisible={
                        !filteredState.hasAnnotationFilters ||
                        !filteredState.hasAnnotationFilters
                      }
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
            <React.Fragment key={`image-tools-${tool.name}`}></React.Fragment>
          );
        })}
      </Drawer>
    </>
  );
};
