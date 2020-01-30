import Button from "@material-ui/core/Button/Button";
import {generateAction} from "@piximi/store";
import * as React from "react";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {useStyles} from "./GenerateButton.css";
import {
  categoriesSelector,
  categorizedImagesSelector,
  validationPercentageSelector
} from "@piximi/store/dist";

export const GenerateButton = ({next}: {next: any}) => {
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    const payload = {
      images: images,
      categories: categories,
      options: {
        validationPercentage: validationPercentage
      }
    };

    dispatch(generateAction(payload));

    next();
  }, [dispatch]);

  const categories = useSelector(categoriesSelector);

  const images = useSelector(categorizedImagesSelector);

  const validationPercentage = useSelector(validationPercentageSelector);

  const classes = useStyles({});

  return (
    <Button
      className={classes.button}
      color="primary"
      onClick={onClick}
      variant="contained"
    >
      Generate
    </Button>
  );
};
