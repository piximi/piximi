import type { SxProps, Theme } from "@mui/material";

export const sectionStyle = { position: "relative", mx: 1, mb: 2 };
export const sectionLabelStyle = (theme: Theme) => ({
  position: "absolute",
  top: "-0.6rem",
  left: "1rem",
  px: 0.5,
  bgcolor: theme.palette.background.paper,
});

export const expandToggleStyle = (theme: Theme, expanded: boolean) => ({
  position: "absolute",
  top: "-0.875rem",
  right: "0.5rem",
  p: 0.5,
  bgcolor: theme.palette.background.paper,
  "&:hover": {
    "& .MuiSvgIcon-root": {
      transform: `scale(1.15) rotate(${expanded ? 0 : 180}deg)`,
    },
    bgcolor: theme.palette.background.paper,
  },
  "&.Mui-disabled": {
    bgcolor: theme.palette.background.paper,
  },
  "& .MuiSvgIcon-root": {
    transform: `rotate(${expanded ? 0 : 180}deg)`,
    transition: theme.transitions.create(["transform"]),
  },
});

export const chipFrameStyle =
  (height: number | undefined, expanded: boolean): SxProps<Theme> =>
  (theme) => ({
    boxSizing: "content-box",
    overflow: "hidden",
    display: "block",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    height,
    transition: theme.transitions.create(["height", "padding"]),
    px: expanded ? 1 : 0,
    py: expanded ? 1.5 : 0,
  });
export const chipListStyle = { display: "flex", flexWrap: "wrap", gap: 0.5 };
