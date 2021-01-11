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

type ColorAdjustmentOptionsProps = {
  image: Image;
};

export const ColorAdjustmentOptions = ({
  image,
}: ColorAdjustmentOptionsProps) => {
  const LightnessSetting = ({ name }: { name: string }) => {
    return (
      <ListItemText
        id="discrete-slider"
        primary={name}
        secondary={
          <Slider
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            value={50}
          />
        }
      />
    );
  };

  const [openLightness, setOpenLightness] = React.useState(false);

  const onLightnessToggle = () => {
    setOpenLightness(!openLightness);
  };

  return (
    <React.Fragment>
      <List>
        <ListItem dense disabled>
          <ListItemText primary="Histogram" />
        </ListItem>
      </List>

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
            <ListItem dense>
              <LightnessSetting name="Exposure" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </React.Fragment>
  );
};
