import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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

  return (
    <Container sx={{ maxHeight: 400, width: "100%" }}>
      <Typography
        align={"center"}
        variant="h5"
        gutterBottom
        sx={(theme) => ({ pb: theme.spacing(1) })}
      >
        Model Summary
      </Typography>

      <TableContainer sx={{ maxHeight: 300, width: "100%" }}>
        <Table
          stickyHeader
          aria-label="sticky table"
          sx={{ alignContent: "center" }}
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
    </Container>
  );
};
