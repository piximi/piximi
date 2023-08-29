import React from "react";

import { List } from "@mui/material";

import {
  NewProjectListItem,
  OpenProjectListItem,
  SaveProjectListItem,
} from "components/list-items";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
