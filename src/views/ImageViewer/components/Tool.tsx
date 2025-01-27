import React, { useEffect, useMemo } from "react";

import {
  Box,
  Divider,
  IconButton,
  Popover,
  Popper,
  SvgIcon,
  Tooltip,
  useTheme,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { ToolHotkeyTitle } from "components/ui/tooltips";
import IncrementalSlider from "components/inputs/IncrementalSlider";
import { useMenu } from "hooks";
import { SliderOptions } from "utils/common/types";

type ToolProps = {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
  disabled?: boolean;
  tooltipLocation?: "top" | "bottom" | "left" | "right";
  selected?: boolean;
};

//TODO: tool buttons

export const Tool = ({
  children,
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  selected,
}: ToolProps) => {
  const theme = useTheme();
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
          <IconButton disabled={disabled} onClick={handleClick}>
            <SvgIcon
              fontSize="small"
              sx={{
                color: selected
                  ? theme.palette.primary.dark
                  : theme.palette.grey[400],
              }}
            >
              {children}
            </SvgIcon>
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
export const ResizableTool = ({
  children,
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  selected,
  callback,
  toolLimits = { min: 1, max: 10, step: 1, initial: 1 },
  callbackOnSlide,
  onClickOpen,
}: ToolProps & {
  selected?: boolean;
  callback: (value: number) => void;
  toolLimits: SliderOptions;
  callbackOnSlide?: boolean;
  onClickOpen?: boolean;
}) => {
  const { anchorEl, onClose, onOpen, open } = useMenu();
  const theme = useTheme();

  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  useEffect(() => {
    if (!selected) {
      onClose();
    }
  }, [selected, onClose]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowY: "visible",
        zIndex: "inherit",
      }}
    >
      <Tooltip
        sx={{ zIndex: 1001 }}
        title={description}
        placement={tooltipLocation}
        disableInteractive
      >
        <span>
          <IconButton
            disabled={disabled}
            onClick={(event) => {
              handleClick();
              onClickOpen && onOpen(event);
            }}
            sx={{
              bgcolor: "background.paper",
              zIndex: 1001,
            }}
          >
            <SvgIcon
              fontSize="small"
              sx={{
                color: selected
                  ? theme.palette.primary.dark
                  : theme.palette.grey[400],
              }}
            >
              {children}
            </SvgIcon>
          </IconButton>
        </span>
      </Tooltip>
      {selected && (
        <IconButton
          sx={{
            bgcolor: "background.paper",
            py: 0,
            pb: 0.5,
            borderRadius: "0 0 4px 4px",
            "&:hover": {
              bgcolor: "background.paper",
            },
          }}
          onClick={(event) => {
            onOpen(event.currentTarget.parentElement!);
          }}
        >
          <ExpandMore
            sx={{ fontSize: "0.75rem", mx: "auto", lineHeight: "0.75rem" }}
          />
        </IconButton>
      )}
      <Popper
        open={open}
        anchorEl={anchorEl}
        disablePortal
        placement={tooltipLocation}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            borderRadius: "8px",
            bgcolor: "background.paper",
          }}
        >
          <IncrementalSlider
            min={toolLimits.min}
            max={toolLimits.max}
            step={toolLimits.step}
            initialValue={toolLimits.initial}
            callback={callback}
            orientation="vertical"
            length="100px"
            callbackOnSlide={callbackOnSlide}
          />
          <Divider />
          <IconButton onClick={onClose} sx={{ p: 0.5 }}>
            <ExpandLess sx={{ fontSize: "1rem", lineHeight: "0.75rem" }} />
          </IconButton>
        </Box>
      </Popper>
    </Box>
  );
};
export const PopoverTool = ({
  children,
  name,
  tooltipLocation = "bottom",
  selected,
  popoverElement,
}: Omit<ToolProps, "onClick"> & {
  popoverElement?: React.ReactNode;
}) => {
  const { anchorEl, onClose, onOpen, open } = useMenu();
  const theme = useTheme();

  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        position: "relative",
        overflowY: "visible",
        overflowX: "visible",
        zIndex: "inherit",
      }}
    >
      <Tooltip
        sx={{ zIndex: 1001 }}
        title={description}
        placement={tooltipLocation}
        disableInteractive
      >
        <span>
          <IconButton
            onClick={!open ? onOpen : onClose}
            sx={{
              bgcolor: "background.paper",
              zIndex: 1001,
            }}
          >
            <SvgIcon
              fontSize="small"
              sx={{
                color: selected
                  ? theme.palette.primary.dark
                  : theme.palette.grey[400],
              }}
            >
              {children}
            </SvgIcon>
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        slotProps={{ paper: { sx: { overflow: "visible" } } }}
      >
        {popoverElement}
      </Popover>
    </Box>
  );
};
