import { Box, Button, List, ListItem, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { classifierSlice } from "../../../store/slices";
import { useDispatch } from "react-redux";

export const UploadClassifier = () => {
  const [jsonFile, setJsonFile] = useState<File | undefined>(undefined);
  const [weightsFile, setWeightsFile] = useState<File | undefined>(undefined);

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
      </List>
    </>
  );
};
