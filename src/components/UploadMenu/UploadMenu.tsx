import React from "react";
import { Menu } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import Fade from "@material-ui/core/Fade";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ComputerIcon from "@material-ui/icons/Computer";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import { useStyles } from "./UploadMenu.css";
import { useDispatch } from "react-redux";
import { createImage } from "../../store/slices";
import { DropboxMenuItem } from "../DropboxMenuItem";

type UploadMenuProps = {
  anchorEl: HTMLElement;
  onClose: () => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose, open }: UploadMenuProps) => {
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

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target) {
          const img = new Image();
          const src = event.target.result;

          img.onload = (e: Event) => {
            const element = e.target as HTMLCanvasElement;
            const aspectRatio = element.height / element.width;

            dispatch(createImage({ src: img.src, aspectRatio: aspectRatio }));
          };
          img.src = src as string;
        }
      };

      reader.readAsDataURL(blob);
    }
  };

  return (
    <React.Fragment>
      <input
        accept="image/*"
        hidden
        type="file"
        id="upload-images"
        onChange={onUploadFromComputerChange}
      />
      <Menu
        PaperProps={{ style: { width: 320 } }}
        TransitionComponent={Fade}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        getContentAnchorEl={null}
        onClose={onClose}
        open={Boolean(anchorEl)}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <ListSubheader className={classes.subheader}>Upload from</ListSubheader>

        <label htmlFor="upload-images">
          <MenuItem
            className={classes.item}
            component="span"
            dense
            onClick={onClose}
          >
            <ListItemIcon>
              <ComputerIcon />
            </ListItemIcon>
            <ListItemText primary="Computer" />
          </MenuItem>
        </label>

        <DropboxMenuItem onClose={onClose} />
      </Menu>
    </React.Fragment>
  );
};
