import React from "react";

import { List } from "@mui/material";

import { SaveProjectListItem } from "components/list-items";
import { NewProjectListItem, OpenProjectListItem } from "components/list-items";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
