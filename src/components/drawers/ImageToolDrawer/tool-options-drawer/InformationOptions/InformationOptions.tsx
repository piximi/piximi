import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { ThingInformationTable } from "./ThingInformationTable";
import { selectActiveSelectedThings } from "store/data/selectors/reselectors";

export const InformationOptions = () => {
  const selectedThings = useSelector(selectActiveSelectedThings);
  return selectedThings.length > 0 ? (
    <>
      {selectedThings.map((thing) => (
        <ThingInformationTable
          key={`thing-info-table-${thing.id}`}
          thing={thing}
          collapsible={true}
        />
      ))}
    </>
  ) : (
    <Box display="flex" justifyContent="center">
      <Typography justifyContent="center">Select an object to view</Typography>
    </Box>
  );
};
