import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Grow from "@material-ui/core/Grow";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import Popper from "@material-ui/core/Popper";
import React, { useRef, useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { Image } from "../../../../../types/Image";
import { ReactComponent as EllipticalIcon } from "../../../../../icons/Elliptical.svg";
import { ReactComponent as RectangularIcon } from "../../../../../icons/Rectangular.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { useStyles } from "./MarqueeButtonGroup.css";
import { ButtonGroupMenuItem } from "../ButtonGroupMenuItem";

type MarqueeButtonGroupProps = {
  data: Image;
};

export const MarqueeButtonGroup = ({ data }: MarqueeButtonGroupProps) => {
  const anchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
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
      case SelectionMethod.Elliptical:
        return <EllipticalIcon />;
      default:
        return <RectangularIcon />;
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

      <Popper
        anchorEl={anchorEl.current}
        disablePortal
        open={open}
        role={undefined}
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList dense>
                  <ButtonGroupMenuItem
                    icon={<RectangularIcon />}
                    method={SelectionMethod.Rectangular}
                    name="Rectangular selection"
                    onClick={onClick}
                  />

                  <ButtonGroupMenuItem
                    icon={<EllipticalIcon />}
                    method={SelectionMethod.Elliptical}
                    name="Elliptical selection"
                    onClick={onClick}
                  />
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};
