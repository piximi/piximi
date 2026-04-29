import { useState } from "react";

import { useSelector } from "react-redux";

import { Badge, Box, Fade, Popper, Typography } from "@mui/material";
import { FilterAltOutlined as FilterIcon } from "@mui/icons-material";

import { useWindowSize } from "hooks";

import { TooltipButton } from "components/ui/tooltips";

import { ItemFilters } from "@ProjectViewer/components";
import { selectActiveStateFilterCount } from "@ProjectViewer/state/selectors";

import { DIMENSIONS } from "utils/constants";

import { actionButtonStyle } from "./utils";

export const SortFilter = () => {
  const filtersExist = useSelector(selectActiveStateFilterCount);
  const { height: windowHeight } = useWindowSize();
  const [popperAnchor, setPopperAnchor] = useState<HTMLElement | null>(null);
  const handleToggleFilterPopper = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setPopperAnchor((el) => (el ? null : e.currentTarget));
  };

  const id = popperAnchor ? "transition-popper" : undefined;

  return (
    <>
      <TooltipButton
        tooltipTitle="Sort/Filter"
        color="inherit"
        onClick={handleToggleFilterPopper}
        icon={true}
        data-testid={"filter-items-icon"}
        sx={actionButtonStyle}
      >
        <Badge
          color="primary"
          variant="dot"
          invisible={!filtersExist}
          sx={{
            "& .MuiBadge-badge": {
              top: 4,
              right: "100%",
            },
          }}
        >
          <FilterIcon />
        </Badge>
      </TooltipButton>
      <Popper
        id={id}
        anchorEl={popperAnchor}
        open={!!popperAnchor}
        placement="bottom-end"
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
            <Box
              sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: "1fr",
                gridTemplateRows: `${theme.spacing(4)} 1fr`,
                gap: theme.spacing(1),
                pb: theme.spacing(1),
                bgcolor: theme.palette.background.paper,
                minWidth: DIMENSIONS.leftDrawerWidth,
                width: DIMENSIONS.leftDrawerWidth,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
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
                  variant="h6"
                  sx={{
                    fontWeight: "normal",
                    textTransform: "capitalize",
                    marginInline: "auto",
                    maxWidth: "fit-content",
                  }}
                >
                  {"Sort | Filter"}
                </Typography>
              </Box>
              <Box
                sx={(theme) => ({
                  maxHeight: `calc(${(windowHeight - DIMENSIONS.toolDrawerWidth) * 0.9 - (popperAnchor?.offsetTop ?? 0)}px - ${theme.spacing(9)})`,
                  overflowY: "scroll",
                })}
              >
                <ItemFilters />
              </Box>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
};
