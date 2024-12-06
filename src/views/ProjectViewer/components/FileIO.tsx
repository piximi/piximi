import React from "react";
import { List } from "@mui/material";

import { NewProjectListItem } from "./list-items";
import { OpenProjectListItem } from "./list-items";
import { SaveProjectListItem } from "./list-items";

export const FileIO = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
