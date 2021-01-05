import React, { useState } from "react";
import { Image } from "../../../../../types/Image";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import SvgIcon from "@material-ui/core/SvgIcon";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import { ButtonGroupMenu } from "../ButtonGroupMenu";
import { ButtonGroupMenuItem } from "../ButtonGroupMenuItem";
import { ReactComponent as RectangularIcon } from "../../../../../icons/Rectangular.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { ReactComponent as EllipticalIcon } from "../../../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../../../icons/Magnetic.svg";
import { ReactComponent as MagicWandIcon } from "../../../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../../../icons/Quick.svg";
import { useMenu } from "../../../../../hooks";

type ToolbarButtonGroupProps = {
  data: Image;
};

export const ToolbarButtonGroup = ({ data }: ToolbarButtonGroupProps) => {
  const {
    anchorEl: marqueeMenuAnchorEl,
    onClose: onCloseMarqueeMenu,
    onOpen: onOpenMarqueeMenu,
    open: openMarqueeMenu,
  } = useMenu();

  const {
    anchorEl: lassoMenuAnchorEl,
    onClose: onCloseLassoMenu,
    onOpen: onOpenLassoMenu,
    open: openLassoMenu,
  } = useMenu();

  const {
    anchorEl: probabilisticMenuAnchorEl,
    onClose: onCloseProbabilisticMenu,
    onOpen: onOpenProbabilisticMenu,
    open: openProbabilisticMenu,
  } = useMenu();

  const [method, setMethod] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const [visibleLassoMethod, setVisibleLassoMethod] = useState<SelectionMethod>(
    SelectionMethod.Lasso
  );

  const [visibleMarqueeIcon, setVisibleMarqueeIcon] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const [
    visibleProbabilisticIcon,
    setVisibleProbabilisticIcon,
  ] = useState<SelectionMethod>(SelectionMethod.Quick);

  const onClickLassoMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisibleLassoMethod(method);

    onCloseLassoMenu(event);
  };

  const onClickMarqueeMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisibleMarqueeIcon(method);

    onCloseMarqueeMenu(event);
  };

  const onClickProbabilisticMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisibleProbabilisticIcon(method);

    onCloseProbabilisticMenu(event);
  };

  const MarqueeMethodIcon = () => {
    switch (visibleMarqueeIcon) {
      case SelectionMethod.Elliptical:
        return <EllipticalIcon />;
      default:
        return <RectangularIcon />;
    }
  };

  const LassoMethodIcon = () => {
    switch (visibleLassoMethod) {
      case SelectionMethod.Magnetic:
        return <MagneticIcon />;
      default:
        return <LassoIcon />;
    }
  };

  const ProbabilisticMethodIcon = () => {
    switch (visibleProbabilisticIcon) {
      case SelectionMethod.Color:
        return <MagicWandIcon />;
      default:
        return <QuickIcon />;
    }
  };

  return (
    <React.Fragment>
      <ButtonGroup
        color="inherit"
        ref={marqueeMenuAnchorEl}
        variant="contained"
      >
        <Button>
          <SvgIcon fontSize="small">
            <MarqueeMethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenMarqueeMenu} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <span>&nbsp;&nbsp;</span>

      <ButtonGroup color="inherit" ref={lassoMenuAnchorEl} variant="contained">
        <Button>
          <SvgIcon fontSize="small">
            <LassoMethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenLassoMenu} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <span>&nbsp;&nbsp;</span>

      <ButtonGroup
        color="inherit"
        ref={probabilisticMenuAnchorEl}
        variant="contained"
      >
        <Button>
          <SvgIcon fontSize="small">
            <ProbabilisticMethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenProbabilisticMenu} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroupMenu
        anchorEl={marqueeMenuAnchorEl}
        onClose={onCloseMarqueeMenu}
        open={openMarqueeMenu}
      >
        <ButtonGroupMenuItem
          icon={<RectangularIcon />}
          method={SelectionMethod.Rectangular}
          name="Rectangular selection"
          onClick={onClickMarqueeMenuItem}
        />

        <ButtonGroupMenuItem
          icon={<EllipticalIcon />}
          method={SelectionMethod.Elliptical}
          name="Elliptical selection"
          onClick={onClickMarqueeMenuItem}
        />
      </ButtonGroupMenu>

      <ButtonGroupMenu
        anchorEl={lassoMenuAnchorEl}
        onClose={onCloseLassoMenu}
        open={openLassoMenu}
      >
        <ButtonGroupMenuItem
          icon={<LassoIcon />}
          method={SelectionMethod.Lasso}
          name="Lasso selection"
          onClick={onClickLassoMenuItem}
        />

        <ButtonGroupMenuItem
          icon={<MagneticIcon />}
          method={SelectionMethod.Magnetic}
          name="Magnetic selection"
          onClick={onClickLassoMenuItem}
        />
      </ButtonGroupMenu>

      <ButtonGroupMenu
        anchorEl={probabilisticMenuAnchorEl}
        onClose={onCloseProbabilisticMenu}
        open={openProbabilisticMenu}
      >
        <ButtonGroupMenuItem
          icon={<MagicWandIcon />}
          method={SelectionMethod.Color}
          name="Color selection"
          onClick={onClickProbabilisticMenuItem}
        />

        <ButtonGroupMenuItem
          icon={<QuickIcon />}
          method={SelectionMethod.Quick}
          name="Quick selection"
          onClick={onClickProbabilisticMenuItem}
        />
      </ButtonGroupMenu>
    </React.Fragment>
  );
};
