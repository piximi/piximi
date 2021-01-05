import React, { useState } from "react";
import { Image } from "../../../../../types/Image";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as RectangularIcon } from "../../../../../icons/Rectangular.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { ReactComponent as EllipticalIcon } from "../../../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../../../icons/Magnetic.svg";
import { ReactComponent as MagicWandIcon } from "../../../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../../../icons/Quick.svg";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton/ToggleButton";

type ToolbarButtonGroupProps = {
  data: Image;
};

export const ToolbarButtonGroup = ({ data }: ToolbarButtonGroupProps) => {
  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    method: SelectionMethod
  ) => {
    setMethod(method);
  };

  const [method, setMethod] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  return (
    <ToggleButtonGroup
      exclusive
      onChange={onChange}
      orientation="vertical"
      value={method}
    >
      <ToggleButton
        aria-label="rectangular selection"
        value={SelectionMethod.Rectangular}
      >
        <SvgIcon fontSize="small">
          <RectangularIcon />
        </SvgIcon>
      </ToggleButton>

      <ToggleButton
        aria-label="elliptical selection"
        value={SelectionMethod.Elliptical}
      >
        <SvgIcon fontSize="small">
          <EllipticalIcon />
        </SvgIcon>
      </ToggleButton>

      <ToggleButton aria-label="lasso selection" value={SelectionMethod.Lasso}>
        <SvgIcon fontSize="small">
          <LassoIcon />
        </SvgIcon>
      </ToggleButton>

      <ToggleButton
        aria-label="magnetic selection"
        value={SelectionMethod.Magnetic}
      >
        <SvgIcon fontSize="small">
          <MagneticIcon />
        </SvgIcon>
      </ToggleButton>

      <ToggleButton aria-label="color selection" value={SelectionMethod.Color}>
        <SvgIcon fontSize="small">
          <MagicWandIcon />
        </SvgIcon>
      </ToggleButton>

      <ToggleButton aria-label="quick selection" value={SelectionMethod.Quick}>
        <SvgIcon fontSize="small">
          <QuickIcon />
        </SvgIcon>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
