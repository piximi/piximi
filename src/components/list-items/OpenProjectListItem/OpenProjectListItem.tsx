import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { OpenProjectMenu } from "components/menus";
import { useMenu } from "hooks";
import { CustomListItemButton } from "../CustomListItemButton";

export const OpenProjectListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Open Project"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
      />

      <OpenProjectMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
