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
import { Shape } from "../../types/Shape";
import * as ImageJS from "image-js";
import { Image } from "../../types/Image";
import { v4 } from "uuid";
import { Partition } from "../../types/Partition";

type UploadMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: (event: any) => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  const dispatch = useDispatch();
  const classes = useStyles();

  const onUploadFromComputerChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onClose(event);
    event.persist();
    if (event.currentTarget.files) {
      for (let i = 0; i < event.currentTarget.files.length; i++) {
        const file = event.currentTarget.files[i];

        file.arrayBuffer().then((buffer) => {
          ImageJS.Image.load(buffer).then((image) => {
            //check whether name already exists
            const shape: Shape = {
              channels: image.components,
              frames: 1,
              height: image.height,
              planes: 1,
              width: image.width,
            };

            const imageDataURL = image.toDataURL("image/png", {
              useCanvas: true,
            });

            const loaded: Image = {
              categoryId: "00000000-0000-0000-0000-000000000000",
              id: v4(),
              instances: [],
              name: file.name,
              partition: Partition.Inference,
              shape: shape,
              src: imageDataURL,
            };

            dispatch(createImage({ image: loaded }));
          });
        });
      }
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
