import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import React, { useRef, useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { Image } from "../../../../../types/Image";
import { ReactComponent as MagicWandIcon } from "../../../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../../../icons/Quick.svg";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { ButtonGroupMenuItem } from "../ButtonGroupMenuItem";
import { ButtonGroupMenu } from "../ButtonGroupMenu";

type ProbabilisticButtonGroupProps = {
  data: Image;
};

export const ProbabilisticButtonGroup = ({
  data,
}: ProbabilisticButtonGroupProps) => {
  const probabilisticMenuAnchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Quick
  );

  const [openProbabilisticMenu, setOpenProbabilisticMenu] = useState<boolean>(
    false
  );

  const onClickProbabilisticMenuItem = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisible(method);
    setOpenProbabilisticMenu(false);
  };

  const onCloseProbabilisticMenu = (
    event: React.MouseEvent<Document, MouseEvent>
  ) => {
    if (
      probabilisticMenuAnchorEl.current &&
      probabilisticMenuAnchorEl.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenProbabilisticMenu(false);
  };

  const onOpenProbabilisticMenu = () => {
    setOpenProbabilisticMenu(true);
  };

  const MethodIcon = () => {
    switch (visible) {
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
        ref={probabilisticMenuAnchorEl}
        variant="contained"
      >
        <Button>
          <SvgIcon fontSize="small">
            <MethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpenProbabilisticMenu} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

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
