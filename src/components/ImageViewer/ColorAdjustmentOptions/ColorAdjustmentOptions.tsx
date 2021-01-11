import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import Slider from "@material-ui/core/Slider";
import Collapse from "@material-ui/core/Collapse";
import Switch from "@material-ui/core/Switch";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { Image } from "../../../types/Image";

const LIGHTNESS_OPTIONS = [
  { name: "Exposure" },
  { name: "Highlights" },
  { name: "Shadows" },
  { name: "Brightness" },
  { name: "Contrast" },
  { name: "Black point" },
];

const Histogram = () => {
  return (
    <List>
      <ListItem dense disabled>
        <ListItemText primary="Histogram" />
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
      <Histogram />

      <Divider />

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
