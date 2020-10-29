import { Label } from "@material-ui/icons";
import * as React from "react";
import { Avatar, IconButton } from "@material-ui/core";

type ColorIconButtonProps = {
  color: string;
  colors: string[];
  onColorChange: (color: string) => void;
};

export const ColorIcon = (props: ColorIconButtonProps) => {
  const { color } = props;

  return (
    <React.Fragment>
      <IconButton>
        <Avatar>
          <Label style={{ color: color }} />
        </Avatar>
      </IconButton>
    </React.Fragment>
  );
};
