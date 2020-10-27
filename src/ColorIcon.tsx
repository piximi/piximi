import { Label } from "@material-ui/icons";
import { makeStyles } from "@material-ui/styles";
import * as React from "react";
// import {ColorIconMenu} from "..";
// import {useMenu} from "@piximi/hooks";
import { Avatar, IconButton } from "@material-ui/core";

type ColorIconButtonProps = {
  color: string;
  colors: string[];
  onColorChange: (color: string) => void;
};

/**
 *
 * @param props
 * @constructor
 */
export const ColorIcon = (props: ColorIconButtonProps) => {
  const { color, colors, onColorChange } = props;

  // const {anchorEl, openedMenu, openMenu, closeMenu} = useMenu();

  return (
    <React.Fragment>
      <IconButton>
        <Avatar>
          <Label style={{ color: color }} />
        </Avatar>
      </IconButton>

      {/*<ColorIconMenu*/}
      {/*    anchorEl={anchorEl}*/}
      {/*    closeMenu={closeMenu}*/}
      {/*    color={color}*/}
      {/*    colors={colors}*/}
      {/*    onColorChange={onColorChange}*/}
      {/*    openedMenu={openedMenu}*/}
      {/*    openMenu={openMenu}*/}
      {/*/>*/}
    </React.Fragment>
  );
};
