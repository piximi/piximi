import React from "react";
import { MenuItem } from "@mui/material";

type OpenClassifierMenuItemProps = {
  onClose: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
};

export const OpenClassifierMenuItem = ({
  onClose,
}: OpenClassifierMenuItemProps) => {
  return <MenuItem onClick={onClose}>Open classifier</MenuItem>;
};
