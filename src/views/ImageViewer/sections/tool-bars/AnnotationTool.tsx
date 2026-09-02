import type { ReactElement } from "react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { Box, IconButton, Tooltip } from "@mui/material";
import { KeyboardArrowLeft } from "@mui/icons-material";

import { ToolHotkeyTitle } from "components/ui";

import type { HTMLDataAttributes } from "utils/types";

type ToolProps = HTMLDataAttributes & {
  name: string;
  onClick: () => void;
  disabled?: boolean;
  tooltipLocation?: "top" | "bottom" | "left" | "right";
  selected?: boolean;
  icon: ReactElement;
};

//TODO: tool buttons

export const AnnotationTool = ({
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  icon,
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
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export const PopoverAnnotationTool = ({
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  selected,
  onClickOpen,
  PopoverComponent,
  icon,
}: ToolProps & {
  onClickOpen?: boolean;
  PopoverComponent: ReactElement;
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  useEffect(() => {
    if (!selected) {
      setOptionsOpen(false);
    }
  }, [selected]);

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        display: "flex",
        flexDirection: "row-reverse",
        overflowY: "visible",
        zIndex: "inherit",
        "& > *": {
          transition: theme.transitions.create("all"),
        },
      })}
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
            onClick={() => {
              handleClick();
              if (onClickOpen && selected) {
                setOptionsOpen((v) => !v);
              }
            }}
            sx={{
              zIndex: 1001,
              ml: "1px",
            }}
            size="small"
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>

      {selected && (
        <Box
          sx={{
            background: "transparent",
            display: "flex",
            alignItems: "center",
            position: "absolute",
            right: "100%",
            top: "50%",
            transform: `translateY(-50%) translateX(${optionsOpen ? "-8px" : "calc(100% - 16px)"})`,
            zIndex: -1,
          }}
        >
          <IconButton
            sx={{
              bgcolor: "background.paper",
              pr: 0,
              pl: 0.5,
              width: "16px",
              borderRadius: "4px 0 0 4px",
              "&:hover": {
                bgcolor: "background.paper",
              },
            }}
            onClick={() => {
              setOptionsOpen((v) => !v);
            }}
          >
            <KeyboardArrowLeft
              sx={{
                fontSize: "0.75rem",
                mx: "auto",
                lineHeight: "0.75rem",
                transform: `rotate(${optionsOpen ? 180 : 0}deg)`,
              }}
            />
          </IconButton>
          <Box sx={{ bgcolor: "background.paper", borderRadius: "8px" }}>
            {PopoverComponent}
          </Box>
        </Box>
      )}
    </Box>
  );
};
