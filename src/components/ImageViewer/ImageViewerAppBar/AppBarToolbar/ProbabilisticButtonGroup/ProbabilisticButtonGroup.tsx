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
  const anchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Quick
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
      case SelectionMethod.Color:
        return <MagicWandIcon />;
      default:
        return <QuickIcon />;
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
          icon={<MagicWandIcon />}
          method={SelectionMethod.Color}
          name="Color selection"
          onClick={onClick}
        />

        <ButtonGroupMenuItem
          icon={<QuickIcon />}
          method={SelectionMethod.Quick}
          name="Quick selection"
          onClick={onClick}
        />
      </ButtonGroupMenu>
    </React.Fragment>
  );
};
