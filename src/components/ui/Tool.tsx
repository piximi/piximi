import React, { HTMLAttributes, useEffect, useMemo } from "react";

import {
  Box,
  Divider,
  IconButton,
  Popover,
  Popper,
  Tooltip,
  useTheme,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { ToolHotkeyTitle } from "components/ui/tooltips";
import { IncrementalSlider } from "components/inputs";
import { useMenu } from "hooks";
import { SliderOptions } from "utils/types";
import { HTMLDataAttributes } from "utils/types";

type ToolProps = HTMLDataAttributes & {
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
        flexDirection: "row-reverse",
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
              zIndex: 1001,
              ml: "1px",
            }}
            size="small"
          >
            {children}
          </IconButton>
        </span>
      </Tooltip>
      {selected && (
        <IconButton
          sx={{
            bgcolor: "background.paper",
            pr: 0,
            pl: 0.5,
            borderRadius: "4px 0 0 4px",
            border: `1px solid ${theme.palette.divider}`,
            borderRight: "none",
            "&:hover": {
              bgcolor: "background.paper",
            },
          }}
          onClick={(event) => {
            onOpen(event.currentTarget.parentElement!);
          }}
        >
          <KeyboardArrowLeft
            sx={{ fontSize: "0.75rem", mx: "auto", lineHeight: "0.75rem" }}
          />
        </IconButton>
      )}
      <Popper
        open={open}
        anchorEl={anchorEl}
        disablePortal
        placement={tooltipLocation}
        sx={{
          bgcolor: "background.paper",
          borderRadius: "8px",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
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
          <IconButton
            onClick={onClose}
            sx={{ p: 0.5, borderRadius: "0 0 8px 8px" }}
          >
            <KeyboardArrowRight
              sx={{ fontSize: "1rem", lineHeight: "0.75rem" }}
            />
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
  popoverElement,
  disabled,
}: Omit<ToolProps, "onClick"> & {
  popoverElement?: React.ReactNode;
}) => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  return (
    <Box sx={{}}>
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
            disabled={disabled}
            size="small"
          >
            {children}
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{ paper: { sx: { overflow: "visible" } } }}
      >
        {popoverElement}
      </Popover>
    </Box>
  );
};
