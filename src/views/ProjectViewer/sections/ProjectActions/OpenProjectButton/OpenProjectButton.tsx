import { useCallback, useState } from "react";

import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

import { HelpItem } from "data/help/HelpContent";

import { TooltipTextButton } from "@ProjectViewer/components";

import { OpenMenu } from "./OpenMenu";

export const OpenProjectButton = () => {
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
      <TooltipTextButton
        dataHelp={HelpItem.OpenMenu}
        icon={<FolderOpenIcon />}
        label="Open"
        tooltipText="Open images or a previously saved project"
        onClick={onOpen}
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
