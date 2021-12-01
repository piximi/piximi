import React from "react";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";
import { List } from "@mui/material";

export const FileList = () => {
  return (
    <List dense>
      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
