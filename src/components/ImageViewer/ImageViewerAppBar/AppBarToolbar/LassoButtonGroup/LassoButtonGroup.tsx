import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import React, { useRef, useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { Image } from "../../../../../types/Image";
import { ReactComponent as LassoIcon } from "../../../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../../../icons/Magnetic.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { ButtonGroupMenuItem } from "../ButtonGroupMenuItem";
import { ButtonGroupMenu } from "../ButtonGroupMenu";

type LassoButtonGroupProps = {
  data: Image;
};

export const LassoButtonGroup = ({ data }: LassoButtonGroupProps) => {
  const anchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Lasso
  );

  const [open, setOpen] = useState<boolean>(false);

  const onClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisible(method);
    setOpen(false);
  };

  const onClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      anchorEl.current &&
      anchorEl.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };

  const MethodIcon = () => {
    switch (visible) {
      case SelectionMethod.Magnetic:
        return <MagneticIcon />;
      default:
        return <LassoIcon />;
    }
  };

  return (
    <React.Fragment>
      <ButtonGroup color="inherit" ref={anchorEl} variant="contained">
        <Button>
          <SvgIcon fontSize="small">
            <MethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpen} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroupMenu anchorEl={anchorEl} onClose={onClose} open={open}>
        <ButtonGroupMenuItem
          icon={<LassoIcon />}
          method={SelectionMethod.Lasso}
          name="Lasso selection"
          onClick={onClick}
        />

        <ButtonGroupMenuItem
          icon={<MagneticIcon />}
          method={SelectionMethod.Magnetic}
          name="Magnetic selection"
          onClick={onClick}
        />
      </ButtonGroupMenu>
    </React.Fragment>
  );
};
