import React, { ReactElement, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Badge,
  Box,
  Drawer,
  IconButton,
  Popper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  FilterAltOutlined as FilterAltOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  FolderOpen as FolderOpenIcon,
  Straighten as StraightenIcon,
  ScatterPlot as ScatterPlotIcon,
  Label as LabelIcon,
  Gesture as GestureIcon,
} from "@mui/icons-material";

import { useMenu, useMobileView, useTranslation, useWindowSize } from "hooks";

import { ToolHotkeyTitle } from "components/ui";
import { ProjectViewerCategories, FileIO } from "../../components";
import { ModelTaskSection } from "../ModelTaskSection";
import {
  FilterOptions,
  InformationOptions,
  MeasurementOptions,
} from "./tool-options";

import { selectActiveFilteredStateHasFilters } from "store/project/selectors";

import { DIMENSIONS } from "utils/constants";
import { capitalize } from "utils/stringUtils";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { ImageViewerOptions } from "./tool-options/ImageViewerOptions";
import { HTMLDataAttributes } from "utils/types";
import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";

type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options?: ReactElement;
  action?: () => void;
  hotkey: string;
  mobile?: boolean;
  helpContext?: HelpItem;
};

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
    options: <ImageViewerOptions />,
    hotkey: "A",
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
  const { anchorEl, onOpen: setPopperAnchor } = useMenu();
  const { height: windowHeight } = useWindowSize();

  const handleSelectTool = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    tool: OperationType,
  ) => {
    if (activeTool === undefined) {
      setActiveTool(tool);
      setPopperAnchor(event);
      setIsOpen(true);
    } else {
      if (tool === activeTool) {
        setActiveTool(undefined);
        setIsOpen(false);
      } else {
        setPopperAnchor(event);
        setActiveTool(tool);
      }
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        sx={(theme) => ({
          flexShrink: 0,
          whiteSpace: "nowrap",
          "& > .MuiDrawer-paper": {
            zIndex: 99,
            width: DIMENSIONS.toolDrawerWidth + "px",
            pt: theme.spacing(1),
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          },
        })}
        variant="permanent"
        open={isOpen}
      >
        <Popper
          anchorEl={anchorEl}
          open={!!activeTool && isOpen}
          //onClose={onClose}
          placement="left-start"
          modifiers={[
            { name: "preventOverflow", options: { boundary: "viewport" } },
          ]}
          sx={(theme) => ({
            minWidth: DIMENSIONS.leftDrawerWidth,
            width: DIMENSIONS.leftDrawerWidth,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            zIndex: 100,
          })}
        >
          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: `${theme.spacing(8)} 1fr`,
              gap: theme.spacing(1),
              pb: theme.spacing(1),
            })}
          >
            <Box
              width={"100%"}
              sx={(theme) => ({
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderBottom: "1px solid " + theme.palette.text.primary,
              })}
            >
              <Typography
                variant="h5"
                sx={{
                  textTransform: "capitalize",
                  marginInline: "auto",
                  maxWidth: "fit-content",
                }}
              >
                {activeTool?.name}
              </Typography>
            </Box>
            <Box
              sx={{
                maxHeight: `calc(${(windowHeight - DIMENSIONS.toolDrawerWidth) * 0.9 - (anchorEl?.offsetTop ?? 0)}px - ${theme.spacing(9)})`,
                overflowY: "scroll",
              }}
            >
              {activeTool?.options}
            </Box>
          </Box>
        </Popper>
        <Stack>
          {Object.values(imageTools).map((tool) => {
            return !tool.mobile || isMobile ? (
              <Tool
                data-help={tool.helpContext}
                options={tool.options}
                name={t(capitalize(tool.name))}
                onClick={(event) => {
                  handleSelectTool(event, tool);
                }}
                key={`tool-drawer-${tool.name}`}
                tooltipLocation="left"
              >
                {tool.name === "filters" ? (
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={!filtersExist}
                  >
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
        </Stack>
        {isMobile && (
          <Stack sx={{ py: 0.5, px: 2 }}>
            <SettingsButton />

            <SendFeedbackButton />

            <HelpButton />
          </Stack>
        )}
      </Drawer>
    </>
  );
};

type ToolProps = HTMLDataAttributes & {
  children: React.ReactNode;
  options?: React.ReactElement;
  name: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  tooltipLocation?: "top" | "bottom" | "left" | "right";
  selected?: boolean;
};

//TODO: tool buttons

const Tool = ({
  children,
  options,
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  ...attributes
}: ToolProps) => {
  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  return (
    <Box
      sx={(theme) => ({
        zIndex: "inherit",
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Tooltip title={description} placement={tooltipLocation}>
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={handleClick}
            {...attributes}
          >
            {children}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
