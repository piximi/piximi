import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { OpenMenu } from "./OpenMenu";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const OpenProjectListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.OpenMenu}
        data-testid="open-project-button"
        primaryText="Open"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
        tooltipText="Open Project/Image"
      />

      <OpenMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
