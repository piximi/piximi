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
  const lassoMenuAnchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Lasso
  );

  const [openLassoMenu, setOpenLassoMenu] = useState<boolean>(false);

  const onClickLassoMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisible(method);
    setOpenLassoMenu(false);
  };

  const onCloseLassoMenu = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      lassoMenuAnchorEl.current &&
      lassoMenuAnchorEl.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenLassoMenu(false);
  };

  const onOpenLassoMenu = () => {
    setOpenLassoMenu(true);
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
      <ButtonGroup color="inherit" ref={lassoMenuAnchorEl} variant="contained">
        <Button>
          <SvgIcon fontSize="small">
            <MethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenLassoMenu} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

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
    </React.Fragment>
  );
};
