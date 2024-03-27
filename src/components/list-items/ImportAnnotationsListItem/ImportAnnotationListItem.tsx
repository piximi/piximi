import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { useMenu } from "hooks";
import { OpenImageMenuNew } from "components/menus";
import { CustomListItemButton } from "../CustomListItemButton";

export const ImportAnnotationListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Import Annotations"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
      />

      <OpenImageMenuNew anchorEl={anchorEl} onCloseMenu={onClose} open={open} />
    </>
  );
};
