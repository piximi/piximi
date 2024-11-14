import React from "react";

import { List } from "@mui/material";

import { SaveProjectListItem } from "sections/list-items";
import { NewProjectListItem, OpenProjectListItem } from "sections/list-items";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
