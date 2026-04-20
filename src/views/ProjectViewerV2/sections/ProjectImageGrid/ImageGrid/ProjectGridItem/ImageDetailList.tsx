import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";

import { ImageObject } from "store/dataV2/types";

export const ImageDetailList = ({
  image,
  color,
}: {
  image: ImageObject;
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
