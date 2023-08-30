import React from "react";
import useDropboxChooser from "use-dropbox-chooser";

import { ListItemIcon, ListItemText } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";

import { StyledMenuItem } from "./StyledMenuItem";

type DropboxMenuItemProps = {
  onClose: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const DropboxMenuItem = ({ onClose }: DropboxMenuItemProps) => {
  // const dispatch = useDispatch();

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
    <StyledMenuItem component="span" dense onClick={open}>
      <ListItemIcon>
        <ComputerIcon />
      </ListItemIcon>
      <ListItemText primary="Dropbox" />
    </StyledMenuItem>
  );
};
