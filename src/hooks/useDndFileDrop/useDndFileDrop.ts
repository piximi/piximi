import { DropTargetMonitor, useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

type DndFileDropItem = {
  files: FileList;
  items: DataTransferItemList;
  dataTransfer: DataTransfer;
};

export const useDndFileDrop = (onDrop: (files: FileList) => void) => {
  return useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop({ files }: DndFileDropItem) {
        if (onDrop) {
          onDrop(files);
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop]
  );
};
