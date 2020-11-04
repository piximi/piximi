import React from "react";
import { Menu } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import Fade from "@material-ui/core/Fade";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ComputerIcon from "@material-ui/icons/Computer";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import { useStyles } from "./index.css";
import { useDispatch } from "react-redux";
import { projectSlice } from "./store/slices";

type UploadMenuProps = {
  anchorEl: HTMLElement;
  onClose: () => void;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  const dispatch = useDispatch();
  const classes = useStyles();

  const onUploadFromComputerChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onClose();
    event.persist();
    console.log(event.currentTarget.files);
    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          dispatch(
            projectSlice.actions.createProjectImageAction({
              src: src as string,
            })
          );
        }
      };

      reader.readAsDataURL(blob);
    }
  };

  return (
    <React.Fragment>
      <input
        accept="image/*"
        className={classes.fileInput}
        type="file"
        id="upload-images"
        onChange={onUploadFromComputerChange}
      />
      <Menu
        TransitionComponent={Fade}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "center", horizontal: "left" }}
        getContentAnchorEl={null}
        onClose={onClose}
        open={Boolean(anchorEl)}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <ListSubheader>Upload from</ListSubheader>
        <label htmlFor="upload-images">
          <MenuItem onClick={onClose} component="span">
            <ListItemIcon>
              <ComputerIcon />
            </ListItemIcon>
            <ListItemText primary="Computer" />
          </MenuItem>
        </label>
      </Menu>
    </React.Fragment>
  );
};
