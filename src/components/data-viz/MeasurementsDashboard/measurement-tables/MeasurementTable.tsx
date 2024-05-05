import { Paper, Table, TableBody, TableContainer } from "@mui/material";
import { MeasurementDisplayTable } from "store/measurements/types";
import { MeasurementRow } from "./MeasurementRow";

export const MeasurementTable = ({
  tableId,
  tableMeasurements,
}: {
  tableId: string;
  tableMeasurements: Record<string, MeasurementDisplayTable>;
}) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableBody>
          {Object.entries(tableMeasurements).map((tableMeasurement) => {
            return (
              <MeasurementRow
                key={`table-${tableId}-${tableMeasurement[0]}`}
                tableMeasurement={tableMeasurement[0]}
                tableData={tableMeasurement[1]}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
