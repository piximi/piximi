import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";

import { ExtendedAnnotationObject } from "store/dataV2/types";

export const AnnotationDetailList = ({
  annotation,
  color,
}: {
  annotation: ExtendedAnnotationObject;
  color: string;
}) => {
  return (
    <List dense>
      <ListItem>
        <ListItemText
          primary={`Image: ${annotation.imageName}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      {annotation.shape && (
        <>
          <ListItem>
            <ListItemText
              primary={`Width: ${annotation.shape.width} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${annotation.shape.height} px`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Channels: ${annotation.shape.channels}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Plane: ${annotation.planeIdx}`}
              slotProps={{ primary: { sx: { color: color } } }}
            />
          </ListItem>
        </>
      )}
      <ListItem>
        <ListItemText
          primary={`Partition: ${annotation.partition}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
    </List>
  );
};
