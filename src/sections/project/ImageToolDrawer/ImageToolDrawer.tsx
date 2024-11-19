import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Badge,
  Drawer,
  ListItemButton,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import {
  FilterAltOutlined as FilterAltOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  FolderOpen as FolderOpenIcon,
  Sort as SortIcon,
  Straighten as StraightenIcon,
  ScatterPlot as ScatterPlotIcon,
  Label as LabelIcon,
} from "@mui/icons-material";

import { useMobileView, useTranslation } from "hooks";

import { AppBarOffset } from "components/AppBarOffset";
import { SortSelection } from "components/SortSelection";
import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";
import { FileIO } from "sections/file-io";
import { ProjectViewerCategories } from "sections/categories";
import { ModelTaskSection } from "../ModelTaskSection";
import {
  FilterOptions,
  InformationOptions,
  MeasurementOptions,
} from "./tool-options";
import { OperationType, ToolOptionsDrawer } from "./ToolOptionsDrawer";

import { selectActiveFilteredStateHasFilters } from "store/project/selectors";
import { dimensions } from "utils/common/constants";

const imageTools: Record<string, OperationType> = {
  fileIO: {
    icon: (color) => <FolderOpenIcon sx={{ color }} />,
    name: "fileIO",
    description: "-",
    options: <FileIO />,
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
  measurements: {
    icon: (color) => <StraightenIcon sx={{ color: color }} />,
    name: "measurements",
    description: "-",
    options: <MeasurementOptions />,
    hotkey: "M",
    mobile: true,
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
    options: <ProjectViewerCategories />,
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
              <ListItemButton
                sx={{ flexGrow: 0 }}
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
              </ListItemButton>
            </TooltipCard>
          ) : (
            <React.Fragment key={`tool-drawer-${tool.name}`}></React.Fragment>
          );
        })}
      </Drawer>
    </>
  );
};
