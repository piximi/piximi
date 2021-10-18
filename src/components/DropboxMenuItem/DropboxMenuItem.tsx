import React from "react";
import { useStyles } from "./DropboxMenuItem.css";
import useDropboxChooser from "use-dropbox-chooser";
import { useDispatch } from "react-redux";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";

type DropboxMenuItemProps = {
  onClose: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const DropboxMenuItem = ({ onClose }: DropboxMenuItemProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const { open } = useDropboxChooser({
    appKey: "tetle78x244mpkz",
    chooserOptions: { multiselect: true, linkType: "direct" },
    onSelected: (items: readonly Dropbox.ChooserFile[]) => {
      //onClose();

      items.forEach((item: Dropbox.ChooserFile) => {
        //dispatch(createImage({ src: item.link as string }));
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
