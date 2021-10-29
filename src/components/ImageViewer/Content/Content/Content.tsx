import React, { useRef } from "react";
import { Stage } from "../Stage";
import { useStyles } from "./Content.css";
import { NativeTypes } from "react-dnd-html5-backend";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { useBoundingClientRect } from "../../../../annotator/hooks/useBoundingClientRect";
import { useCursor } from "../../../../annotator/hooks";

type ContentProps = {
  onDrop: (item: { files: any[] }) => void;
};

export const Content = ({ onDrop }: ContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const classes = useStyles();

  useBoundingClientRect(ref);

  const [, drop] = useDrop(
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

      <main className={classes.content} ref={ref}>
        <div ref={drop}>
          <Stage />
        </div>
      </main>
    </>
  );
};
