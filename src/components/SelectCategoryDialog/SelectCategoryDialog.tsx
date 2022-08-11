import React from "react";

import {
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

export interface SimpleDialogProps {
  open: boolean;
  selectedCategory: string;
  onClose: (value: string) => void;
}

const categories = ["category 1", "category 2", "category 3"];

export const SelectCategoryDialog = (props: SimpleDialogProps) => {
  const { onClose, selectedCategory, open } = props;

  const handleClose = () => {
    onClose(selectedCategory);
  };

  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogTitle id="simple-dialog-title">Select category</DialogTitle>
      <List>
        {categories.map((category) => (
          <ListItem
            button
            onClick={() => handleListItemClick(category)}
            key={category}
          >
            <ListItemText primary={category} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};
