import React from "react";
import { List } from "@mui/material";

import {
  NewProjectListItem,
  OpenProjectListItem,
  SaveProjectListItem,
} from "./list-items";
import { ConfirmReplaceDialogProvider } from "../hooks/useConfirmReplaceProjectDialog";

export const FileIO = () => {
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
