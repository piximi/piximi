import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  ClickAwayListener,
  Fade,
  IconButton,
  Popper,
  Tooltip,
} from "@mui/material";
import { KeyboardArrowLeft } from "@mui/icons-material";

import { ToolHotkeyTitle } from "../ui/ToolHotkeyTitle";

import type { ReactElement } from "react";

import type { PopperProps } from "@mui/material";

import type { HTMLDataAttributes } from "utils/types";

type ToolProps = HTMLDataAttributes & {
  name: string;
  onClick: () => void;
  disabled?: boolean;
  tooltipLocation?: "top" | "bottom" | "left" | "right";
  selected?: boolean;
  icon: ReactElement;
  hotkey?: string[];
};

export const ToolButton = ({
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  icon,
  hotkey,
  ...attributes
}: ToolProps) => {
  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} hotkey={hotkey} />,
    [name, hotkey],
  );

  return (
    <Box
      sx={{
        zIndex: "inherit",
        backgroundColor: "transparent",
      }}
    >
      <Tooltip
        title={description}
        placement={tooltipLocation}
        disableInteractive
        enterDelay={500}
      >
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={handleClick}
            sx={{ borderRadius: 0 }}
            {...attributes}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export const PopperToolButton = ({
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  popperPlacement = "bottom-end",
  icon,
  hotkey,
  popperContent,
  clickAway,
  ...attributes
}: ToolProps & {
  popperContent: ReactElement;
  popperPlacement?: PopperProps["placement"];
  clickAway?: boolean;
}) => {
  const popperAnchorRef = useRef<HTMLElement | null>();
  const [popperAnchor, setPopperAnchor] = useState<HTMLElement | null>(null);
  const handleTogglePopper = () => {
    setPopperAnchor((el) => (el ? null : popperAnchorRef.current!));
  };

  const id = popperAnchor ? "transition-popper" : undefined;

  return (
    <>
      <Box ref={popperAnchorRef} sx={{ p: 0 }}>
        <ToolButton
          name={name}
          onClick={handleTogglePopper}
          icon={icon}
          disabled={disabled}
          tooltipLocation={tooltipLocation}
          hotkey={hotkey}
          {...attributes}
        />
      </Box>
      <Popper
        id={id}
        anchorEl={popperAnchor}
        open={!!popperAnchor}
        placement={popperPlacement}
        modifiers={[
          { name: "preventOverflow", options: { boundary: "viewport" } },
        ]}
        sx={{
          zIndex: 100,
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Box>
              {clickAway ? (
                <ClickAwayListener onClickAway={() => setPopperAnchor(null)}>
                  {popperContent}
                </ClickAwayListener>
              ) : (
                popperContent
              )}
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export const InteractivePopoverToolButton = ({
  name,
  onClick: handleClick,
  disabled = false,
  tooltipLocation = "bottom",
  selected,
  onClickOpen,
  PopoverComponent,
  icon,
  hotkey,
}: ToolProps & {
  onClickOpen?: boolean;
  PopoverComponent: ReactElement;
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} hotkey={hotkey} />,
    [name, hotkey],
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
              borderRadius: 0,
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
