import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ComputerIcon from "@material-ui/icons/Computer";
import ListItemText from "@material-ui/core/ListItemText";
import { useStyles } from "./DropboxMenuItem.css";
import useDropboxChooser from "use-dropbox-chooser";
import { createImage } from "../../store/slices";
import { useDispatch } from "react-redux";

type DropboxMenuItemProps = {
  onClose: () => void;
};

export const DropboxMenuItem = ({ onClose }: DropboxMenuItemProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const { open } = useDropboxChooser({
    appKey: "tetle78x244mpkz",
    chooserOptions: { multiselect: true, linkType: "direct" },
    onSelected: (items) => {
      items.forEach((item: Dropbox.ChooserFile) => {
        dispatch(createImage({ src: item.link as string }));
      });
    },
  });

  return (
    <MenuItem className={classes.item} component="span" dense onClick={open}>
      <ListItemIcon>
        <ComputerIcon />
      </ListItemIcon>
      <ListItemText primary="Dropbox" />
    </MenuItem>
  );
};
