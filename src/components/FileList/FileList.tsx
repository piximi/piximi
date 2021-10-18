import React from "react";
import { NewClassifierListItem } from "../NewClassifierListItem";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";
import { List } from "@mui/material";

export const FileList = () => {
  return (
    <List dense>
      <NewClassifierListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
