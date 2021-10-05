import React from "react";
import MenuItem from "@material-ui/core/MenuItem";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

export const OpenExampleProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const onClickExampleProject = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    popupState.close();
  };

  return (
    <MenuItem onClick={onClickExampleProject}>Open example project</MenuItem>
  );
};
