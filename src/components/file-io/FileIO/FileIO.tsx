import React from "react";
import { List } from "@mui/material";

import { NewProjectListItem } from "../NewProjectListItem";
import { OpenProjectListItem } from "../OpenProjectListItem";
import { SaveProjectListItem } from "../SaveProjectListIItem";

export const FileIO = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
