import React from "react";

import { List } from "@mui/material";

import {
  NewProjectListItem,
  OpenListItem,
  SaveListItem,
} from "components/list-items";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
