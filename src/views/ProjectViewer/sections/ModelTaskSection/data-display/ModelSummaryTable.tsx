import {
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import saveAs from "file-saver";
import { useSelector } from "react-redux";
import { selectProjectName } from "store/project/selectors";
import { Model } from "utils/models/Model/Model";

interface Column {
  id: "layerName" | "outputShape" | "parameters" | "trainable";
  label: string;
  minWidth?: number;
}

const columns: readonly Column[] = [
  { id: "layerName", label: "Layer Name", minWidth: 170 },
  { id: "outputShape", label: "Output Shape", minWidth: 100 },
  {
    id: "parameters",
    label: "# of Parameters",
    minWidth: 100,
  },
  {
    id: "trainable",
    label: "Trainable",
    minWidth: 40,
  },
];

type ModelSummaryTableProps = {
  model: Model;
};

export const ModelSummaryTable = (props: ModelSummaryTableProps) => {
  const { model } = props;
  const projectName = useSelector(selectProjectName);

  const handleExportModelSummary = () => {
    const headers = columns.map((column) => column.label).join(",") + "\n";
    const rows = model.modelSummary
      .map((row) =>
        columns
          .map((column) => {
            return column.id === "outputShape"
              ? `"'${row[column.id].replaceAll(",", " ")}"`
              : row[column.id];
          })
          .join(","),
      )
      .join("\n");
    const csvContent = headers + rows;

    const data = new Blob([csvContent], { type: "text/csv" });
    saveAs(data, `${projectName}-model_summary.csv`);
  };
  return (
    <Container sx={{ maxHeight: 400, width: "100%" }}>
      <TableContainer sx={{ maxHeight: 300, width: "100%", my: 2 }}>
        <Table
          stickyHeader
          aria-label="sticky table"
          sx={{ alignContent: "center" }}
          size="small"
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {model.modelSummary.map((row, idx) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={idx}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return <TableCell key={column.id}>{value}</TableCell>;
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Button onClick={handleExportModelSummary}>Export Model Summary</Button>
    </Container>
  );
};
