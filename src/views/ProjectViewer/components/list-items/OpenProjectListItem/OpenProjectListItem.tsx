import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { OpenMenu } from "./OpenMenu";

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
