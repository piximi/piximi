import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import React, { useRef, useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { Image } from "../../../../../types/Image";
import { ReactComponent as EllipticalIcon } from "../../../../../icons/Elliptical.svg";
import { ReactComponent as RectangularIcon } from "../../../../../icons/Rectangular.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { ButtonGroupMenuItem } from "../ButtonGroupMenuItem";
import { ButtonGroupMenu } from "../ButtonGroupMenu";

type MarqueeButtonGroupProps = {
  data: Image;
};

export const MarqueeButtonGroup = ({ data }: MarqueeButtonGroupProps) => {
  const marqueeMenuAnchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const [openMarqueeMenu, setOpenMarqueeMenu] = useState<boolean>(false);

  const onClickMarqueeMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisible(method);
    setOpenMarqueeMenu(false);
  };

  const onCloseMarqueeMenu = (
    event: React.MouseEvent<Document, MouseEvent>
  ) => {
    if (
      marqueeMenuAnchorEl.current &&
      marqueeMenuAnchorEl.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenMarqueeMenu(false);
  };

  const onOpenMarqueeMenu = () => {
    setOpenMarqueeMenu(true);
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
      <ButtonGroup
        color="inherit"
        ref={marqueeMenuAnchorEl}
        variant="contained"
      >
        <Button>
          <SvgIcon fontSize="small">
            <MethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenMarqueeMenu} size="small">
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
    </React.Fragment>
  );
};
