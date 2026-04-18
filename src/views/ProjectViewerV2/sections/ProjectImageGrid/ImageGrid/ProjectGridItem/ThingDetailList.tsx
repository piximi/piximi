import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";

import { Thing } from "store/data/types";

export const ThingDetailList = ({
  thing,
  color,
}: {
  thing: Thing;
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
