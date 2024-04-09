import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";
import { ThingType } from "store/data/types";

export const ThingDetailList = ({
  thing,
  color,
}: {
  thing: ThingType;
  color: string;
}) => {
  return (
    <List dense>
      <ListItem>
        <ListItemText
          primary={`Name: ${thing.name}`}
          primaryTypographyProps={{ sx: { color: color } }}
        />
      </ListItem>
      {thing.shape && (
        <>
          <ListItem>
            <ListItemText
              primary={`Width: ${thing.shape.width} px`}
              primaryTypographyProps={{ sx: { color: color } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${thing.shape.height} px`}
              primaryTypographyProps={{ sx: { color: color } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Channels: ${thing.shape.channels}`}
              primaryTypographyProps={{ sx: { color: color } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Planes: ${thing.shape.planes}`}
              primaryTypographyProps={{ sx: { color: color } }}
            />
          </ListItem>
        </>
      )}
      <ListItem>
        <ListItemText
          primary={`Partition: ${thing.partition}`}
          primaryTypographyProps={{ sx: { color: color } }}
        />
      </ListItem>
    </List>
  );
};
