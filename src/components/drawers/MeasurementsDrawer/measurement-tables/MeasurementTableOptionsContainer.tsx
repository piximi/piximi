import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { MeasurementTableOptions } from "./MeasurementTableOptions";
import { SelectDialog } from "components/dialogs";
import { Add } from "@mui/icons-material";
import { batch, useDispatch, useSelector } from "react-redux";
import { selectMeasurementTables } from "store/measurements/selectors";
import {
  selectCategoriesByKind,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { useDialog } from "hooks";
import { DataArray } from "utils/file-io/types";

export const MeasurementTableOptionsContainer = () => {
  const tables = useSelector(selectMeasurementTables);
  const categoriesByKind = useSelector(selectCategoriesByKind);
  const kinds = useSelector(selectKindDictionary);
  const [kindOptions, setKindOptions] = useState<string[]>(Object.keys(kinds));
  const thingData = useSelector(selectThingsDictionary);
  const dispatch = useDispatch();
  const [expandedTable, setExpandedTable] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const worker: Worker = useMemo(
    () => new Worker(new URL("./worker.ts", import.meta.url)),
    []
  );

  const {
    onClose: handleCloseTableDialog,
    onOpen: handleOpenTableDialog,
    open: isTableDialogOpen,
  } = useDialog();

  const handleCreateTable = (kind: string) => {
    const thingIds = kinds[kind].containing;
    const convertedThingData: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[] = thingIds.map((thingId) => {
      const thing = thingData[thingId];
      if ("encodedMask" in thing) {
        return {
          id: thing.id,
          kind: kind,
          data: thing.data.arraySync(),
          encodedMask: thing.encodedMask,
          decodedMask: thing.decodedMask,
        };
      } else {
        return { id: thing.id, kind: kind, data: thing.data.arraySync() };
      }
    });

    if (window.Worker) {
      setLoading(true);
      worker.postMessage({ kind: kind, things: convertedThingData });
    }
  };
  const handleTableTreeExpand = (tableId: string) => {
    setExpandedTable((currentId) => {
      return tableId === currentId ? undefined : tableId;
    });
  };

  useEffect(() => {
    setKindOptions(Object.keys(kinds));
  }, [kinds]);

  useEffect(() => {
    if (window.Worker) {
      worker.onmessage = (
        e: MessageEvent<{
          kind: string;
          data: Record<
            string,
            {
              channels: number[][];
              maskData: DataArray | undefined;
              maskShape: { width: number; height: number } | undefined;
            }
          >;
        }>
      ) => {
        const numChannels = Object.values(e.data.data)[0].channels.length;
        batch(() => {
          dispatch(
            measurementsSlice.actions.createTable({
              kind: e.data.kind,
              categories: categoriesByKind(e.data.kind),
              thingIds: Object.keys(e.data.data),
              numChannels,
            })
          );
          dispatch(
            measurementsSlice.actions.updateMeasurements({
              dataDict: e.data.data,
            })
          );
        });
        setLoading(false);
      };
    }
  }, [worker, dispatch, categoriesByKind]);

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
        {loading ? (
          <Box
            sx={{
              p: 0,
              pl: "calc(8px* 1.2)",
              pr: "calc(8px* 1.2)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CircularProgress size="1.25rem" />
          </Box>
        ) : (
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
        )}
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
        options={kindOptions as string[]}
        selectLabel="Kind"
        title="Create Measurement Table"
        onConfirm={handleCreateTable}
      />
    </>
  );
};
