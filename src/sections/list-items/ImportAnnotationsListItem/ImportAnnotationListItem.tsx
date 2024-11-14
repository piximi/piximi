import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { useMenu } from "hooks";
import { OpenImageMenu } from "sections/menus";
import { CustomListItemButton } from "../../../components/CustomListItemButton";

export const ImportAnnotationListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Import Annotations"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
        selected={open}
      />

      <OpenImageMenu anchorEl={anchorEl} onCloseMenu={onClose} open={open} />
    </>
  );
};
