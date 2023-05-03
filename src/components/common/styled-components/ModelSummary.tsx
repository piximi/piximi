import { LayersModel } from "@tensorflow/tfjs";

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

interface ModelLayerData {
  layerName: string;
  outputShape: string;
  parameters: number;
  trainable: string;
}

const getModelSummary = (model: LayersModel): ModelLayerData[] => {
  const modelSummary: ModelLayerData[] = [];

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];

    const outputShape = layer.outputShape;
    const parameters = layer.countParams();
    const layerName = layer.name;
    const trainable = layer.trainable;

    const layerSummary: ModelLayerData = {
      layerName,
      outputShape: String(outputShape).slice(1),
      parameters: parameters,
      trainable: String(trainable),
    };

    modelSummary.push(layerSummary);
  }
  return modelSummary;
};

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
  compiledModel: LayersModel;
};

export const ModelSummaryTable = (props: ModelSummaryTableProps) => {
  const { compiledModel } = props;

  const modelSummary = getModelSummary(compiledModel);

  return (
    <Container sx={{ maxHeight: 400, width: 900 }}>
      <Typography align={"center"} variant="body1">
        Model Summary
      </Typography>

      <TableContainer sx={{ maxHeight: 300, width: 900 }}>
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
            {modelSummary.map((row, idx) => {
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
