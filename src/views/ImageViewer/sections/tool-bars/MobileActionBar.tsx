import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Badge,
  Box,
  IconButton,
  List,
  Popper,
  PopperProps,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Image as ImageIcon,
  FolderOpen as FolderOpenIcon,
  Label as LabelIcon,
} from "@mui/icons-material";

import { useMenu, useMobileView, useTranslation, useWindowSize } from "hooks";

import { ToolHotkeyTitle } from "components/ui";
import {
  ExportAnnotationsListItem,
  ImageViewerCategories,
} from "../../components";

import { selectActiveFilteredStateHasFilters } from "store/project/selectors";

import { DIMENSIONS } from "utils/constants";
import { capitalize } from "utils/stringUtils";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { HTMLDataAttributes } from "utils/types";
import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";
import { OperationType } from "views/ImageViewer/utils/types";
import { ImageList } from "../ImageViewerDrawer/ImageList";

const imageTools: Record<string, OperationType> = {
  fileIO: {
    icon: (color) => <FolderOpenIcon fontSize="small" sx={{ color }} />,
    name: "fileIO",
    description: "-",
    options: (
      <List dense>
        <ExportAnnotationsListItem />
      </List>
    ),
    hotkey: "O",
    mobile: true,
  },

  images: {
    icon: (color) => <ImageIcon fontSize="small" sx={{ color: color }} />,
    name: "images",
    description: "-",
    options: <ImageList />,
    hotkey: "F",
    helpContext: HelpItem.FilterImageGrid,
  },

  categories: {
    icon: (color) => <LabelIcon fontSize="small" sx={{ color }} />,
    name: "categories",
    description: "-",
    options: <ImageViewerCategories />,
    hotkey: "C",
    mobile: true,
  },
};

//TODO: Icon button
export const MobileActionBar = () => {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<OperationType>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const filtersExist = useSelector(selectActiveFilteredStateHasFilters);
  const t = useTranslation();
  const isMobile = useMobileView();
  const { anchorEl, onOpen: setPopperAnchor } = useMenu();

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
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        justifyContent: "space-between",
        alignItems: "center",
        gridArea: "mobile-action-bar",
      })}
    >
      <ContentPopper
        anchorEl={anchorEl}
        activeTool={activeTool}
        open={!!activeTool && isOpen}
        //onClose={onClose}
        placement="right-start"
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
      />
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
      </Stack>

      <Stack sx={{ py: 0.5, px: 2 }}>
        <SettingsButton />

        <SendFeedbackButton />

        <HelpButton />
      </Stack>
    </Stack>
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

export const Tool = ({
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

const ContentPopper = ({
  activeTool,
  ...popperProps
}: {
  activeTool?: OperationType;
} & PopperProps) => {
  const { height: windowHeight } = useWindowSize();
  return (
    <Popper
      anchorEl={popperProps.anchorEl}
      open={popperProps.open}
      placement="right-start"
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
          sx={(theme) => ({
            maxHeight: `calc(${(windowHeight - DIMENSIONS.toolDrawerWidth) * 0.9 - ((popperProps.anchorEl as HTMLElement | undefined)?.offsetTop ?? 0)}px - ${theme.spacing(9)})`,
            overflowY: "scroll",
          })}
        >
          {activeTool?.options}
        </Box>
      </Box>
    </Popper>
  );
};
