import React from "react";
import { Menu } from "@mui/material";
import Fade from "@mui/material/Fade";
import ListItemIcon from "@mui/material/ListItemIcon";
import ComputerIcon from "@mui/icons-material/Computer";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { useDispatch, useSelector } from "react-redux";
import { createImage } from "../../store/slices";
import { DropboxMenuItem } from "./DropboxMenuItem";
import { convertFileToImage } from "../../image/imageHelper";
import { StyledMenuItem } from "./StyledMenuItem";
import { currentColorsSelector } from "../../store/selectors/currentColorsSelector";

type UploadMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: (event: any) => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  const dispatch = useDispatch();
  const colors = useSelector(currentColorsSelector);

  const onUploadFromComputerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onClose(event);
    event.persist();

    if (!event.currentTarget.files) return;

    const files = event.currentTarget.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const image = await convertFileToImage(file, colors, 1, 3); //todo fix: use dialog box

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
