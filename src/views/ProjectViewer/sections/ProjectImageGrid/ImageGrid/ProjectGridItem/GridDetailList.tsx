import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";

import { ImageGridObject, TSAnnotationObject } from "store/data/types";

export const ImageDetailList = ({
  image: image,
  color,
}: {
  image: ImageGridObject;
  color: string;
}) => {
  return (
    <List dense>
      <ListItem>
        <ListItemText
          primary={`Name: ${image.name}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      {image.shape && (
        <>
          <ListItem>
            <ListItemText
              primary={`Width: ${image.shape.width} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${image.shape.height} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Channels: ${image.shape.channels}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Planes: ${image.shape.planes}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
        </>
      )}
      <ListItem>
        <ListItemText
          primary={`Partition: ${image.partition}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
    </List>
  );
};

export const AnnotationDetailList = ({
  thing,
  color,
}: {
  thing: TSAnnotationObject;
  color: string;
}) => {
  return (
    <List dense>
      <ListItem>
        <ListItemText
          primary={`Name: ${thing.name}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      {thing.shape && (
        <>
          <ListItem>
            <ListItemText
              primary={`Width: ${thing.shape.width} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${thing.shape.height} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Channels: ${thing.shape.channels}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Planes: ${thing.shape.planes}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
        </>
      )}
      <ListItem>
        <ListItemText
          primary={`Partition: ${thing.partition}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
    </List>
  );
};
