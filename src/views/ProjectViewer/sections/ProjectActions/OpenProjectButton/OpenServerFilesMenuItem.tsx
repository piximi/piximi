import { Fragment, useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { ServerFilesDialog } from "@ProjectViewer/components/dialogs";

type OpenServerFilesMenuItemProps = {
  onCloseMenu: () => void;
};

/* Images on the backend's machine; only a backend with `ingest.paths`. */
export const OpenServerFilesMenuItem = ({
  onCloseMenu,
}: OpenServerFilesMenuItemProps) => {
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    onCloseMenu();
  };
  return (
    <Fragment>
      <MenuItem
        dense
        onClick={() => setOpen(true)}
        data-testid="open-server-files"
      >
        <ListItemText primary="Server Files" />
      </MenuItem>
      {open && <ServerFilesDialog open onClose={handleClose} />}
    </Fragment>
  );
};
