import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { OpenMenu } from "components/menus";
import { useMenu } from "hooks";
import { CustomListItemButton } from "../CustomListItemButton";

export const OpenProjectListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Open"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
        tooltipText="Open Project/Image"
      />

      <OpenMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
