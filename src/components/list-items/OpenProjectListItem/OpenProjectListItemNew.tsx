import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { useMenu } from "hooks";
import { CustomListItemButton } from "../CustomListItemButton";
import { OpenMenuNew } from "components/menus/OpenMenu/OpenMenuNew";

export const OpenProjectListItemNew = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Open"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
        tooltipText="Open Project/Image"
      />

      <OpenMenuNew anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
