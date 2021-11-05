import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { classifierSlice, projectSlice } from "../../../store/slices";
import { useDispatch, useSelector } from "react-redux";
import { categoriesSelector } from "../../../store/selectors";
import { architectureOptionsSelector } from "../../../store/selectors/architectureOptionsSelector";
import { inputShapeSelector } from "../../../store/selectors/inputShapeSelector";

export const UploadClassifier = () => {
  const [jsonFile, setJsonFile] = useState<File | undefined>(undefined);
  const [weightsFile, setWeightsFile] = useState<File | undefined>(undefined);
  const [categoriesFile, setCategoriesFile] = useState<File | undefined>(
    undefined
  );

  const architectureOptions = useSelector(architectureOptionsSelector);
  const inputShape = useSelector(inputShapeSelector);

  const dispatch = useDispatch();

  const onOpenJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    if (!event.currentTarget.files) return;

    setJsonFile(event.currentTarget.files[0]);
  };

  const onOpenWeights = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    if (!event.currentTarget.files) return;

    setWeightsFile(event.currentTarget.files[0]);
  };

  const onOpenCategories = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    if (!event.currentTarget.files) return;

    setCategoriesFile(event.currentTarget.files[0]);

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result) {
        const categories = JSON.parse(event.target.result as string);

        //Open project
        dispatch(
          projectSlice.actions.setCategories({
            categories: categories.categories,
          })
        );
      }
    };

    reader.readAsText(event.currentTarget.files[0]);
  };

  const openModel = async (jsonFile: File, weightsFile: File) => {
    const model = await tf.loadLayersModel(
      tf.io.browserFiles([jsonFile, weightsFile])
    );
    dispatch(classifierSlice.actions.updateOpened({ opened: model }));
  };

  useEffect(() => {
    if (!jsonFile || !weightsFile) return;
    openModel(jsonFile, weightsFile);
  }, [jsonFile, weightsFile]);

  return (
    <>
      <List dense>
        <ListItem component={"label"}>
          <input
            accept="application/json"
            hidden
            id="open-json-file"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onOpenJSON(event)
            }
            type="file"
          />
          <Button component="span" size={"small"} variant="outlined">
            Upload json file
          </Button>
          <Typography>{jsonFile ? jsonFile.name : ""}</Typography>
        </ListItem>

        <ListItem component={"label"}>
          <Button component="span" size={"small"} variant="outlined">
            Upload model weights
          </Button>
          <Typography>{weightsFile ? weightsFile.name : ""}</Typography>
          <input
            accept="application/bin"
            hidden
            id="open-weights-file"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onOpenWeights(event)
            }
            type="file"
          />
        </ListItem>

        <ListItem component={"label"}>
          <Button component="span" size={"small"} variant="outlined">
            Upload categories
          </Button>
          <Typography>{categoriesFile ? categoriesFile.name : ""}</Typography>
          <input
            accept="application/bin"
            hidden
            id="open-weights-file"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onOpenCategories(event)
            }
            type="file"
          />
        </ListItem>
      </List>

      <Grid container direction={"row"} spacing={2}>
        <Grid item xs={1}>
          <TextField
            id="shape-rows"
            label="Input rows"
            // className={classes.textField}
            value={inputShape.height}
            onChange={() => {}}
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-cols"
            label="Input cols"
            // className={classes.textField}
            value={inputShape.width}
            onChange={() => {}}
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-channels"
            label="Input channels"
            // className={classes.textField}
            value={inputShape.channels}
            onChange={() => {}}
          />
        </Grid>
      </Grid>
    </>
  );
};
