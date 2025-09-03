import React, { useEffect } from "react";
import { List, ListItem, ListItemText } from "@mui/material";

import { GeneralizedKindItem } from "store/data/types";

export const KindItemDetailList = ({
  item: item,
  color,
}: {
  item: GeneralizedKindItem;
  color: string;
}) => {
  useEffect(() => {
    console.log(item);
  });
  return (
    <List dense>
      <ListItem>
        <ListItemText
          primary={`Name: ${item.name}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>

      <ListItem>
        <ListItemText
          primary={`Width: ${item.shape.width} px`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={`Height: ${item.shape.height} px`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={`Channels: ${item.shape.channels}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={`Planes: ${item.shape.planes}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={`Partition: ${item.partition}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={`Bit Depth: ${item.bitDepth}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>

      <ListItem>
        <ListItemText
          primary={`Plane: ${item.plane ?? item.activePlane}`}
          slotProps={{ primary: { sx: { color: color } } }}
        />
      </ListItem>
      {item.timepoint !== undefined && (
        <ListItem>
          <ListItemText
            primary={`Timepoint: ${item.timepoint}`}
            slotProps={{ primary: { sx: { color: color } } }}
          />
        </ListItem>
      )}
    </List>
  );
};
