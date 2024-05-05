import { Box, IconButton, Typography } from "@mui/material";
import React, { useState } from "react";
import { MeasurementTableOptions } from "./MeasurementTableOptions";
import { SelectDialog } from "components/dialogs";
import { Add } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { selectMeasurementTables } from "store/measurements/selectors";
import { selectAllKindIds, selectCategoriesByKind } from "store/data/selectors";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { useDialog } from "hooks";

export const MeasurementTableOptionsContainer = () => {
  const tables = useSelector(selectMeasurementTables);
  const categoriesByKind = useSelector(selectCategoriesByKind);
  const kinds = useSelector(selectAllKindIds);
  const dispatch = useDispatch();
  const [expandedTable, setExpandedTable] = useState<string | undefined>();

  const handleCreateTable = (kind: string) => {
    dispatch(
      measurementsSlice.actions.createTable({
        kind,
        categories: categoriesByKind(kind),
      })
    );
  };
  const handleTableTreeExpand = (tableId: string) => {
    setExpandedTable((currentId) => {
      return tableId === currentId ? undefined : tableId;
    });
  };

  const {
    onClose: handleCloseTableDialog,
    onOpen: handleOpenTableDialog,
    open: isTableDialogOpen,
  } = useDialog();

  return (
    <>
      <Box display="flex" alignItems="center" my={1}>
        <Box
          sx={(theme) => ({
            height: 0,
            borderBottom: `thin solid ${theme.palette.divider}`,
            width: "7%",
          })}
        />
        <Typography
          sx={{
            //reapply formatting of DividerHeader
            margin: 0,
            pl: "calc(8px* 1.2)",
            pr: "calc(8px* 1.2)",
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
            fontWeight: "400",
            fontSize: "0.875rem",
            lineHeight: "1.43",
            letterSpacing: "0.01071em",
            textTransform: "uppercase",
          }}
        >
          Tables
        </Typography>
        <Box
          sx={(theme) => ({
            height: 0,
            borderBottom: `thin solid ${theme.palette.divider}`,
            flexGrow: 1,
          })}
        />
        <IconButton
          disableRipple
          sx={(theme) => ({
            p: 0,
            pl: "calc(8px* 1.2)",
            pr: "calc(8px* 1.2)",
            "&:hover": { color: theme.palette.primary.main },
          })}
          onClick={handleOpenTableDialog}
        >
          <Add fontSize="small" />
        </IconButton>
        <Box
          sx={(theme) => ({
            height: 0,
            borderBottom: `thin solid ${theme.palette.divider}`,
            width: "5%",
          })}
        />
      </Box>
      {Object.values(tables).map((table) => (
        <MeasurementTableOptions
          key={table.id}
          table={table}
          expanded={expandedTable === table.id}
          handleTableExpand={handleTableTreeExpand}
        />
      ))}
      <SelectDialog
        open={isTableDialogOpen}
        onClose={handleCloseTableDialog}
        options={kinds as string[]}
        selectLabel="Kind"
        title="Create Measurement Table"
        onConfirm={handleCreateTable}
      />
    </>
  );
};
