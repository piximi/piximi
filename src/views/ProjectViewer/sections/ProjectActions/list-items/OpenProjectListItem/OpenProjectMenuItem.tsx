import type React from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useProjectLoader } from "hooks";

import { useConfirmReplaceDialog } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

//TODO: MenuItem??

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
}: OpenProjectMenuItemProps) => {
  const { getConfirmation } = useConfirmReplaceDialog();
  const { loadProject } = useProjectLoader();
  const onOpenProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();
    if (!event.currentTarget.files) return;
    const files = event.currentTarget.files;
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    await loadProject(files);
    event.target.value = "";
  };

  return (
    <>
      <MenuItem component="label" dense>
        <ListItemText primary="Project from Zarr" />
        <input
          accept=".zarr"
          hidden
          id="open-project-zarr"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onMenuClose();
            onOpenProject(event);
          }}
          type="file"
          // @ts-ignore: need it for some reason
          webkitdirectory=""
        />
      </MenuItem>
      <MenuItem component="label" dense>
        <ListItemText primary="Project from Zip" />
        <input
          accept="application/zip"
          hidden
          id="open-project-zip"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onMenuClose();
            onOpenProject(event);
          }}
          type="file"
        />
      </MenuItem>
    </>
  );
};
