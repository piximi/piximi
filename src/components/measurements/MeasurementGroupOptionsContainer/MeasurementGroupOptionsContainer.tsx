import { IconButton } from "@mui/material";
import React, { useState } from "react";
import { MeasurementGroupOptions } from "./MeasurementGroupOptions";
import { SelectDialog } from "components/dialogs";
import { Add } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { selectMeasurementGroups } from "store/measurements/selectors";
import { DividerWithLoading } from "components/styled-components";
import { useCreateMeasurementTable } from "../hooks";

export const MeasurementGroupOptionsContainer = () => {
  const tables = useSelector(selectMeasurementGroups);
  const [expandedTable, setExpandedTable] = useState<string | undefined>();

  const {
    status,
    handleCloseTableDialog,
    handleCreateTable,
    handleOpenTableDialog,
    isTableDialogOpen,
    kindOptions,
  } = useCreateMeasurementTable();

  const handleTableTreeExpand = (tableId: string) => {
    setExpandedTable((currentId) => {
      return tableId === currentId ? undefined : tableId;
    });
  };

  return (
    <>
      <DividerWithLoading
        title="Tables"
        loadStatus={status}
        loadedStateIcon={
          <>
            <IconButton
              disableRipple
              sx={(theme) => ({
                p: 0,
                pl: "calc(8px * 1.2)",
                pr: "calc(8px * 1.2)",
                "&:hover": { color: theme.palette.primary.main },
              })}
              onClick={handleOpenTableDialog}
            >
              <Add fontSize="small" />
            </IconButton>
          </>
        }
      />

      {Object.values(tables).map((table) => (
        <MeasurementGroupOptions
          key={table.id}
          table={table}
          expanded={expandedTable === table.id}
          handleTableExpand={handleTableTreeExpand}
        />
      ))}
      <SelectDialog
        open={isTableDialogOpen}
        onClose={handleCloseTableDialog}
        options={kindOptions as string[]}
        selectLabel="Kind"
        title="Create Measurement Table"
        onConfirm={handleCreateTable}
      />
    </>
  );
};
