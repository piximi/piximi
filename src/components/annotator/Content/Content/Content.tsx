import React, { useRef } from "react";
import { Stage } from "../Stage";
import { useStyles } from "./Content.css";
import { NativeTypes } from "react-dnd-html5-backend";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { useBoundingClientRect } from "../../../../hooks/useBoundingClientRect";
import { styled } from "@mui/material/styles";

type ContentProps = {
  onDrop: (item: { files: any[] }) => void;
};

export const Content = ({ onDrop }: ContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // const classes = useStyles();

  useBoundingClientRect(ref);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (onDrop) {
          onDrop(item);
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    []
  );

  const MainWrapper = ({ children }: { children: JSX.Element }) => {
    return <main ref={ref}>{children}</main>;
  };

  // const StyledMainWrapper = styled(MainWrapper)(({ theme }) => ({
  //   backgroundColor: theme.palette.background.default,
  //   width: "20%",
  //   border: isOver ? "5px solid blue" : "",
  // }));

  const StyledMainWrapper = styled(MainWrapper)({
    width: "20%",
  });

  const MyComponent = styled("main")({
    color: "darkslategray",
    backgroundColor: "aliceblue",
    padding: 8,
    borderRadius: 4,
  });

  return (
    <>
      {/*<AppBar className={classes.appBar} color="default">*/}
      {/*  <Toolbar>*/}
      {/*    <Typography variant="h6" color="inherit">*/}
      {/*      &nbsp;*/}
      {/*    </Typography>*/}
      {/*  </Toolbar>*/}
      {/*</AppBar>*/}

      {/*<Divider />*/}

      <MyComponent>Styled div</MyComponent>

      {/* <StyledMainWrapper>
        <div ref={drop}>
          <Stage />
        </div>
      </StyledMainWrapper> */}

      {/* <main
        className={classes.content}
        ref={ref}
        style={{
          border: isOver ? "5px solid blue" : "",
        }}
      >
        <div ref={drop}>
          <Stage />
        </div>
      </main> */}
    </>
  );
};
