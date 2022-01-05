import React from "react";
import { Menu } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Fade from "@mui/material/Fade";
import ListItemIcon from "@mui/material/ListItemIcon";
import ComputerIcon from "@mui/icons-material/Computer";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { useStyles } from "./UploadMenu.css";
import { useDispatch } from "react-redux";
import { createImage } from "../../store/slices";
import { DropboxMenuItem } from "../DropboxMenuItem";
import { convertFileToImage } from "../../image/imageHelper";

type UploadMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: (event: any) => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  const dispatch = useDispatch();
  const classes = useStyles();

  const onUploadFromComputerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onClose(event);
    event.persist();

    if (!event.currentTarget.files) return;

    const files = event.currentTarget.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const image = await convertFileToImage(file);

      //if length of images is > 1, then the user selected a z-stack --> only show center image
      dispatch(createImage({ image: image }));
    }
  };

  return (
    <>
      <input
        accept="image/*"
        hidden
        type="file"
        multiple
        id="upload-images"
        onChange={onUploadFromComputerChange}
      />
      <Menu
        PaperProps={{ style: { width: 320 } }}
        TransitionComponent={Fade}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
    </>
  );
};
