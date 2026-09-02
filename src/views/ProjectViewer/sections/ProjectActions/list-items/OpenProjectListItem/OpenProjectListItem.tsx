import { useCallback, useState } from "react";

import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { CustomListItemButton } from "@ProjectViewer/components";

import { OpenMenu } from "./OpenMenu";

export const OpenProjectListItem = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [open, setOpen] = useState<boolean>(false);

  const onClose = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, []);

  const onOpen = useCallback(
    (event: React.MouseEvent<HTMLElement> | HTMLElement) => {
      setOpen(true);
      if (event instanceof HTMLElement) {
        setAnchorPosition(null);
        setAnchorEl(event);
        return;
      }
      setAnchorPosition({ top: event.clientY, left: event.clientX + 10 });
      setAnchorEl(event.currentTarget);
    },
    [],
  );

  return (
    <>
      <CustomListItemButton
        data-testid="open-project-button"
        data-help={HelpItem.OpenMenu}
        primaryText="Open"
        onClick={onOpen}
        icon={<FolderOpenIcon />}
        tooltipText="Open Project/Image"
      />

      <OpenMenu
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        onClose={onClose}
        open={open}
      />
    </>
  );
};
