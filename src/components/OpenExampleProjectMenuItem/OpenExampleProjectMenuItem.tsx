import React from "react";
import MenuItem from "@material-ui/core/MenuItem";

type OpenExampleProjectMenuItemProps = {
  onClose: () => void;
};

export const OpenExampleProjectMenuItem = ({
  onClose,
}: OpenExampleProjectMenuItemProps) => {
  return <MenuItem onClick={onClose}>Open example project</MenuItem>;
};
