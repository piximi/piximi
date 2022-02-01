import { Container } from "@mui/material";
import { Typography } from "@mui/material";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { usePreferredNivoTheme } from "hooks/useTheme/usePreferredNivoTheme";

const getHeatMapData = (confusionMatrix: number[][], classNames: string[]) => {
  const data = [];

  const numberOfClasses = classNames.length;
  for (var i = 0; i < numberOfClasses; i++) {
    const datum: { id: string; data: { x: string; y: number }[] } = {
      id: classNames[i],
      data: [],
    };
    for (var j = 0; j < numberOfClasses; j++) {
      const datumEntry = { x: classNames[j], y: confusionMatrix[i][j] };
      datum.data.push(datumEntry);
    }
    data.push(datum);
  }

  return data;
};

type ConfusionMatrixPlotProps = {
  confusionMatrix: number[][];
  classNames: string[];
};

export const ConfusionMatrix = (props: ConfusionMatrixPlotProps) => {
  const { confusionMatrix, classNames } = props;

  const SIZE = 500;

  const data = getHeatMapData(confusionMatrix, classNames);
  const maxVal = Math.max(...confusionMatrix.flat());

  const nivoTheme = usePreferredNivoTheme();

  return (
    <Container sx={{ height: SIZE }}>
      <Typography align={"center"} variant="body1">
        Confusion matrix
      </Typography>
      <ResponsiveHeatMap
        data={data}
        theme={nivoTheme}
        margin={{ top: 5, right: 40, bottom: 150, left: 40 }}
        forceSquare={true}
        axisTop={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -90,
          legend: "Prediction",
          legendPosition: "middle",
          legendOffset: 35,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Groudtruth",
          legendPosition: "middle",
          legendOffset: -35,
        }}
        colors={{
          type: "diverging",
          scheme: "blues",
          minValue: 0,
          maxValue: maxVal,
          divergeAt: 0.5,
        }}
        emptyColor="#555555"
        tooltip={(x, y) => <div></div>}
      />
    </Container>
  );
};
