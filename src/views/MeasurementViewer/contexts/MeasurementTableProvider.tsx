import { createContext, useContext, useMemo } from "react";

import { useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { useBackendQuery } from "core/backend/query";

import { selectDataRevision } from "store/backendSync";
import {
  selectAllChannelMetas,
  selectCategoryEntities,
} from "store/data/selectors";

import {
  concatTables,
  dimensionsOf,
  mergeColumns,
  plotDataOf,
  requestedKeys,
  scopeOf,
  selectedColumns,
  tableRows,
} from "../measurementTable";
import { selectActiveMeasurementGroup } from "../state/selectors";

import type { ReactNode } from "react";

import type { Backend, MeasurementScope, MeasurementTable } from "core/backend";

import type {
  Dimension,
  MeasurementColumnRef,
  MeasurementRow,
  ParsedMeasurementData,
} from "../types";

/* Rows per request; a large table arrives in parts, the last value showing meanwhile. */
const PAGE = 20_000;

const fetchTable = async (
  backend: Backend,
  scope: MeasurementScope,
  columns: string[],
): Promise<MeasurementTable> => {
  const table = backend.measurements!.table.bind(backend.measurements);
  const first = await table({
    scope,
    columns,
    page: { offset: 0, limit: PAGE },
  });
  const parts = [first];
  for (let offset = first.ids.length; offset < first.total; offset += PAGE) {
    const part = await table({ scope, columns, page: { offset, limit: PAGE } });
    if (part.ids.length === 0) break;
    parts.push(part);
  }
  return concatTables(parts);
};

type MeasurementTableContextValue = {
  scope: MeasurementScope | undefined;
  /* The active group's table; the previous one stands in while a new one loads. */
  table: MeasurementTable | undefined;
  loading: boolean;
  columns: MeasurementColumnRef[];
  rows: MeasurementRow[];
  ids: string[];
  plotData: ParsedMeasurementData;
  dimensions: Dimension[];
};

const empty: MeasurementTableContextValue = {
  scope: undefined,
  table: undefined,
  loading: false,
  columns: [],
  rows: [],
  ids: [],
  plotData: {},
  dimensions: [],
};

const MeasurementTableContext =
  createContext<MeasurementTableContextValue>(empty);

/*
 * The active measurement group's table, asked of the backend rather than
 * derived from the store: a remote project's objects are not mirrored, and
 * the backend is where the measurements live. Fetched again whenever the
 * data revision moves or the group's selection changes.
 */
export const MeasurementTableProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const backend = useBackend();
  const revision = useSelector(selectDataRevision);
  const group = useSelector(selectActiveMeasurementGroup);
  const channelMetas = useSelector(selectAllChannelMetas);
  const categories = useSelector(selectCategoryEntities);

  const scope = useMemo(() => group && scopeOf(group), [group]);
  const columns = useMemo(
    () => (group ? selectedColumns(group, channelMetas) : []),
    [group, channelMetas],
  );
  const keys = useMemo(() => requestedKeys(columns), [columns]);
  const queryKey =
    scope && backend.measurements
      ? `measurements:${scope.type}:${scope.kindId ?? ""}:${keys.join(",")}`
      : null;
  const { value: fetched, loading } = useBackendQuery(
    queryKey,
    () => fetchTable(backend, scope!, keys),
    revision,
  );
  const table = useMemo(
    () => fetched && mergeColumns(fetched, columns),
    [fetched, columns],
  );

  const rows = useMemo(
    () => (table && scope ? tableRows(table, scope, categories) : []),
    [table, scope, categories],
  );
  const value = useMemo<MeasurementTableContextValue>(
    () =>
      table && scope
        ? {
            scope,
            table,
            loading,
            columns,
            rows,
            ids: table.ids,
            plotData: plotDataOf(rows, columns, table, scope),
            dimensions: dimensionsOf(rows, scope),
          }
        : { ...empty, scope, loading, columns },
    [table, scope, loading, columns, rows],
  );

  return (
    <MeasurementTableContext.Provider value={value}>
      {children}
    </MeasurementTableContext.Provider>
  );
};

export const useMeasurementTable = (): MeasurementTableContextValue =>
  useContext(MeasurementTableContext);
