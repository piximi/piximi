import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import Slider from "@material-ui/core/Slider";
import Collapse from "@material-ui/core/Collapse";
import Switch from "@material-ui/core/Switch";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { AreaSeries, XYPlot } from "react-vis";
import Image from "image-js";

const LIGHTNESS_OPTIONS = [
  { name: "Exposure" },
  { name: "Highlights" },
  { name: "Shadows" },
  { name: "Brightness" },
  { name: "Contrast" },
  { name: "Black point" },
];

type HistogramProps = {
  bins: number;
  image: Image;
};

const Histogram = ({ bins, image }: HistogramProps) => {
  const histograms = image.getHistograms({ maxSlots: bins });

  const transform = (xs: number[]): { x: number; y: number }[] => {
    return xs.map((element, index) => {
      return { x: index, y: element };
    });
  };

  return (
    <List>
      <ListItem dense disabled>
        <ListItemText primary="Histogram" />

        <XYPlot height={300} width={300}>
          <AreaSeries
            color="#e53935"
            data={transform(histograms[0])}
            opacity={0.5}
          />
          <AreaSeries
            color="#43a047"
            data={transform(histograms[1])}
            opacity={0.5}
          />
          <AreaSeries
            color="#1e88e5"
            data={transform(histograms[2])}
            opacity={0.5}
          />
        </XYPlot>
      </ListItem>
    </List>
  );
};

const Option = ({ name }: { name: string }) => {
  return (
    <ListItem dense>
      <ListItemText primary={name} secondary={<Slider value={50} />} />
    </ListItem>
  );
};

type ColorAdjustmentOptionsProps = {
  image: Image;
};

export const ColorAdjustmentOptions = ({
  image,
}: ColorAdjustmentOptionsProps) => {
  const [openLightness, setOpenLightness] = React.useState(false);

  const onLightnessToggle = () => {
    setOpenLightness(!openLightness);
  };

  return (
    <React.Fragment>
      {/*<Histogram />*/}

      {/*<Divider />*/}

      <List dense>
        <ListItem dense>
          <ListItemText primary="Lightness" />

          <ListItemSecondaryAction>
            <Switch
              checked={openLightness}
              edge="end"
              onChange={onLightnessToggle}
            />
          </ListItemSecondaryAction>
        </ListItem>

        <Collapse in={openLightness} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            {LIGHTNESS_OPTIONS.map((option, index) => {
              return <Option key={index} name={option.name} />;
            })}
          </List>
        </Collapse>
      </List>
    </React.Fragment>
  );
};
