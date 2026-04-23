import React from "react";

import { List } from "@mui/material";

import { ConfirmReplaceDialogProvider } from "@ProjectViewer/hooks/useConfirmReplaceProjectDialog";

import {
  NewProjectListItem,
  OpenProjectListItem,
  SaveProjectListItem,
} from "./list-items";

export const ProjectActions = () => {
  return (
    <ConfirmReplaceDialogProvider>
      <List dense>
        <NewProjectListItem />

        <OpenProjectListItem />

        <SaveProjectListItem />
      </List>
    </ConfirmReplaceDialogProvider>
  );
};
