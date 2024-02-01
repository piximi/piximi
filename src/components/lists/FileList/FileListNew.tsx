import React from "react";

import { List } from "@mui/material";

import { NewProjectListItem, SaveProjectListItem } from "components/list-items";
import { OpenProjectListItemNew } from "components/list-items/OpenProjectListItem/OpenProjectListItemNew";

export const FileListNew = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItemNew />

      <SaveProjectListItem />
    </List>
  );
};
