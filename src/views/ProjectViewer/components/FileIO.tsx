import React from "react";
import { List } from "@mui/material";

import {
  NewProjectListItem,
  OpenProjectListItem,
  SaveProjectListItem,
} from "./list-items";

export const FileIO = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
