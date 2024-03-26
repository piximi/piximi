import React from "react";

import { List } from "@mui/material";

import { SaveProjectListItem } from "components/list-items";
import { OpenProjectListItemNew } from "components/list-items/OpenProjectListItem/OpenProjectListItemNew";
import { NewProjectListItemNew } from "components/list-items/NewProjectListItem/NewProjectListItemNew";

export const FileListNew = () => {
  return (
    <List dense>
      <NewProjectListItemNew />

      <OpenProjectListItemNew />

      <SaveProjectListItem />
    </List>
  );
};
