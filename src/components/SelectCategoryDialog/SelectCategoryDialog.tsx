import React from "react";
import { makeStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import PersonIcon from "@material-ui/icons/Person";
import AddIcon from "@material-ui/icons/Add";
import Typography from "@material-ui/core/Typography";
import { blue } from "@material-ui/core/colors";

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
