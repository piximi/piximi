import { useState, useCallback } from "react";

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu((cm) =>
      cm === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null
    );
  }, []);

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu: contextMenu,
    handleContextMenu: handleContextMenu,
    closeContextMenu: closeContextMenu,
  };
};
