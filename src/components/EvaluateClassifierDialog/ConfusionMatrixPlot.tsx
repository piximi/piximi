import { Typography } from "@mui/material";
import { HeatMap } from "@nivo/heatmap";
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

  const longestClassName = Math.max(...classNames.map((el) => el.length));

  const SIZE = classNames.length > 4 ? 500 : 400;
  const PADDING = longestClassName * 6;

  const data = getHeatMapData(confusionMatrix, classNames);
  const maxVal = Math.max(...confusionMatrix.flat());

  const nivoTheme = usePreferredNivoTheme();

  return (
    <div>
      <Typography align={"center"} variant="body1">
        Confusion matrix:
      </Typography>
      <HeatMap
        width={SIZE}
        height={SIZE}
        data={data}
        theme={nivoTheme}
        margin={{ top: 5, right: 60, bottom: PADDING, left: PADDING + 50 }}
        forceSquare={true}
        axisBottom={{
          tickSize: 7,
          tickPadding: 7,
          tickRotation: -90,
          legendPosition: "middle",
        }}
        axisTop={{
          format: () => "",
          tickSize: 0,
          legend: "Prediction",
          legendPosition: "middle",
          legendOffset: -20,
        }}
        axisLeft={{
          tickSize: 7,
          tickPadding: 7,
          tickRotation: 0,
        }}
        axisRight={{
          format: () => "",
          tickSize: 0,
          legend: "Groudtruth",
          legendPosition: "middle",
          legendOffset: 20,
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
    </div>
  );
};
