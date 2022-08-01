import { HeatMap } from "@nivo/heatmap";

import { Typography } from "@mui/material";

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
  const PADDING = Math.ceil(longestClassName * 6.5);
  const LEGEND_OFFSET = PADDING < 40 ? 40 : PADDING + 40;

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
        margin={{ top: 0, right: 40, bottom: PADDING, left: PADDING + 50 }}
        forceSquare={true}
        axisBottom={{
          tickSize: 7,
          tickPadding: 7,
          tickRotation: -90,
          legendPosition: "middle",
          legend: "Prediction",
          legendOffset: LEGEND_OFFSET,
        }}
        axisTop={null}
        axisLeft={{
          tickSize: 7,
          tickPadding: 7,
          tickRotation: 0,
          legend: "Ground truth",
          legendPosition: "middle",
          legendOffset: -LEGEND_OFFSET,
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
