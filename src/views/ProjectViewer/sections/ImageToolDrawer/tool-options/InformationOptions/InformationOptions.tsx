import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";

import { KindItemInformationTable } from "./KindItemInformationTable";

import { selectActiveFilteredSelectedKindItems } from "store/project/reselectors";

export const InformationOptions = () => {
  const kindItems = useSelector(selectActiveFilteredSelectedKindItems);
  return kindItems.length > 0 ? (
    <>
      {kindItems.map((thing) => (
        <KindItemInformationTable
          key={`thing-info-table-${thing.id}`}
          item={thing}
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
