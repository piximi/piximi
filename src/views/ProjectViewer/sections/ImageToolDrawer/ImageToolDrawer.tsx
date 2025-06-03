import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Badge, Drawer, useTheme } from "@mui/material";
import {
  FilterAltOutlined as FilterAltOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  FolderOpen as FolderOpenIcon,
  Straighten as StraightenIcon,
  ScatterPlot as ScatterPlotIcon,
  Label as LabelIcon,
  Gesture as GestureIcon,
} from "@mui/icons-material";

import { useMobileView, useTranslation } from "hooks";

import { AppBarOffset, Tool } from "components/ui";
import { ProjectViewerCategories, FileIO } from "../../components";
import { ModelTaskSection } from "../ModelTaskSection";
import {
  FilterOptions,
  InformationOptions,
  MeasurementOptions,
} from "./tool-options";
import { OperationType, ToolOptionsDrawer } from "./ToolOptionsDrawer";

import { selectActiveFilteredStateHasFilters } from "store/project/selectors";

import { dimensions } from "utils/constants";
import { capitalize } from "utils/stringUtils";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

const imageTools: Record<string, OperationType> = {
  fileIO: {
    icon: (color) => <FolderOpenIcon fontSize="small" sx={{ color }} />,
    name: "fileIO",
    description: "-",
    options: <FileIO />,
    hotkey: "O",
    mobile: true,
  },

  filters: {
    icon: (color) => (
      <FilterAltOutlinedIcon fontSize="small" sx={{ color: color }} />
    ),
    name: "filter / sort",
    description: "-",
    options: <FilterOptions />,
    hotkey: "F",
    helpContext: HelpItem.FilterImageGrid,
  },
  information: {
    icon: (color) => (
      <InfoOutlinedIcon fontSize="small" sx={{ color: color }} />
    ),
    name: "information",
    description: "-",
    options: <InformationOptions />,
    hotkey: "I",
    helpContext: HelpItem.GridItemInfo,
  },
  measurements: {
    icon: (color) => <StraightenIcon fontSize="small" sx={{ color: color }} />,
    name: "measurements",
    description: "-",
    options: <MeasurementOptions />,
    hotkey: "M",
    mobile: true,
  },
  imageViewer: {
    icon: (color) => <GestureIcon fontSize="small" sx={{ color: color }} />,
    name: "image viewer",
    description: "-",
    options: <MeasurementOptions />,
    hotkey: "M",
    mobile: true,
  },
  learning: {
    icon: (color) => <ScatterPlotIcon fontSize="small" sx={{ color }} />,
    name: "learning",
    description: "-",
    options: <ModelTaskSection />,
    hotkey: "L",
    mobile: true,
  },
  categories: {
    icon: (color) => <LabelIcon fontSize="small" sx={{ color }} />,
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
  const [activeTool, setActiveTool] = useState<OperationType>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const filtersExist = useSelector(selectActiveFilteredStateHasFilters);
  const t = useTranslation();
  const isMobile = useMobileView();

  const handleSelectTool = (tool: OperationType) => {
    if (activeTool === undefined) {
      setActiveTool(tool);
      setIsOpen(true);
    } else {
      if (tool === activeTool) {
        setActiveTool(undefined);
        setIsOpen(false);
      } else {
        setActiveTool(tool);
      }
    }
  };

  return (
    <>
      {activeTool && (!activeTool.mobile || isMobile) && (
        <ToolOptionsDrawer optionsVisibility={isOpen} toolType={activeTool} />
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          },
        })}
        variant="permanent"
        open={isOpen}
      >
        <AppBarOffset />
        {Object.values(imageTools).map((tool) => {
          return !tool.mobile || isMobile ? (
            <Tool
              data-help={tool.helpContext}
              name={t(capitalize(tool.name))}
              onClick={() => {
                handleSelectTool(tool);
              }}
              key={`tool-drawer-${tool.name}`}
              tooltipLocation="left"
            >
              {tool.name === "filters" ? (
                <Badge color="primary" variant="dot" invisible={!filtersExist}>
                  {tool.icon(
                    activeTool === tool
                      ? theme.palette.primary.dark
                      : theme.palette.grey[400],
                  )}
                </Badge>
              ) : (
                tool.icon(
                  activeTool === tool
                    ? theme.palette.primary.dark
                    : theme.palette.grey[400],
                )
              )}
            </Tool>
          ) : (
            <React.Fragment key={`tool-drawer-${tool.name}`}></React.Fragment>
          );
        })}
      </Drawer>
    </>
  );
};
