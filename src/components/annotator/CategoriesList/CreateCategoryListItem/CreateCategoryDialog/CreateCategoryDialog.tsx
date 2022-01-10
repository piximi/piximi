import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ColorIcon } from "../../ColorIcon";
import Grid from "@mui/material/Grid";
import { useStyles } from "./CreateCategoryDialog.css";
import { ColorResult } from "react-color";
import { sample } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { Category } from "../../../../../types/Category";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { replaceDuplicateName } from "../../../../../image/imageHelper";
import { imageViewerSlice } from "../../../../../store/slices";
import { annotatorCategoriesSelector } from "../../../../../store/selectors/annotatorCategoriesSelector";

export const COLORS = [
  "#000000",
  "#004949",
  "#009292",
  "#ff6db6",
  "#ffb6db",
  "#490092",
  "#006ddb",
  "#b66dff",
  "#6db6ff",
  "#b6dbff",
  "#920000",
  "#924900",
  "#db6d00",
  "#24ff24",
  "#ffff6d",
];

type CreateCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  open,
}: CreateCategoryDialogProps) => {
  const dispatch = useDispatch();

  const categories = useSelector(annotatorCategoriesSelector);

  const [color, setColor] = React.useState<string>(sample(COLORS)!);

  const [name, setName] = useState<string>("");

  const classes = useStyles();

  const onCreate = () => {
    const initialName = name ? name : "Unnamed";
    const categoryNames = categories.map((category: Category) => {
      return category.name;
    });
    const updatedName = replaceDuplicateName(initialName, categoryNames);

    const category: Category = {
      color: color,
      id: uuidv4().toString(),
      name: updatedName,
      visible: true,
    };

    dispatch(
      imageViewerSlice.actions.setCategories({
        categories: [...categories, category],
      })
    );

    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );

    setName("");

    onClose();

    setColor(sample(COLORS)!);
  };

  const onColorChange = (color: ColorResult) => {
    setColor(color.hex);
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const t = useTranslation();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <form onSubmit={(event) => onSubmit(event)}>
        <DialogTitle>{t("Create category")}</DialogTitle>

        <DialogContent className={classes.createCategoryDialogContent}>
          <div className={classes.createCategoryDialogGrid}>
            <Grid container spacing={1}>
              <Grid item xs={2} className={classes.createCategoryDialogItem}>
                <ColorIcon color={color} onColorChange={onColorChange} />
              </Grid>
              <Grid item xs={10}>
                <TextField
                  autoFocus
                  fullWidth
                  id="name"
                  label={t("Name")}
                  margin="dense"
                  onChange={onNameChange}
                />
              </Grid>
            </Grid>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="primary">
            {t("Cancel")}
          </Button>

          <Button onClick={onCreate} color="primary" type="submit">
            {t("Create")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
