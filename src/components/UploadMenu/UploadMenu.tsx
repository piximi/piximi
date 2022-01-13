import React from "react";
import { Menu } from "@mui/material";
import Fade from "@mui/material/Fade";
import ListItemIcon from "@mui/material/ListItemIcon";
import ComputerIcon from "@mui/icons-material/Computer";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { useDispatch } from "react-redux";
import { createImage } from "../../store/slices";
import { DropboxMenuItem } from "./DropboxMenuItem";
import { Shape } from "../../types/Shape";
import * as ImageJS from "image-js";
import { Image } from "../../types/Image";
import { v4 as uuidv4 } from "uuid";
import { Partition } from "../../types/Partition";
import { UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { StyledMenuItem } from "./StyledMenuItem";

type UploadMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: (event: any) => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  const dispatch = useDispatch();

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
              categoryId: UNKNOWN_CATEGORY_ID,
              id: uuidv4(),
              annotations: [],
              name: file.name,
              partition: Partition.Inference,
              shape: shape,
              originalSrc: imageDataURL,
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
        <ListSubheader
          sx={{
            color: "#80868b",
            margin: "16px",
            letterSpacing: ".07272727em",
            fontSize: ".6875rem",
            fontWeight: 500,
            lineHeight: "1rem",
            textTransform: "uppercase",
            maxWidth: 320,
          }}
        >
          Upload from
        </ListSubheader>

        <label htmlFor="upload-images">
          <StyledMenuItem component="span" dense onClick={onClose}>
            <ListItemIcon>
              <ComputerIcon />
            </ListItemIcon>
            <ListItemText primary="Computer" />
          </StyledMenuItem>
        </label>

        <DropboxMenuItem onClose={onClose} />
      </Menu>
    </>
  );
};
