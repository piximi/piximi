import React from "react";

import { List } from "@mui/material";

import { SaveProjectListItem } from "components/list-items";
import {
  NewProjectListItemNew,
  OpenProjectListItemNew,
} from "components/list-items";

export const FileListNew = () => {
  return (
    <List dense>
      <NewProjectListItemNew />

      <OpenProjectListItemNew />

      <SaveProjectListItem />
    </List>
  );
};
