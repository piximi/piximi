import { darken, lighten, Theme } from "@mui/material";

export const haloFilter = (c: string, ht: number = 1) =>
  `drop-shadow(0 ${ht}px 0 ${c}) drop-shadow(0 -${ht}px 0 ${c}) drop-shadow(${ht}px 0 0 ${c}) drop-shadow(-${ht}px 0 0 ${c})`;

export const getCategoryIconStyle = (theme: Theme, color: string) => {
  const augment = theme.palette.mode === "dark" ? lighten : darken;
  return {
    color: color,
    filter: haloFilter(augment(color, 0.5), 0.5),
  };
};
