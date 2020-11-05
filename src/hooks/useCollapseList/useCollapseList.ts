import { useState } from "react";

export const useCollapseList = () => {
  const [collapsedList, setCollapsedList] = useState(false);

  const collapseList = () => {
    setCollapsedList(!collapsedList);
  };

  return {
    collapsedList,
    collapseList,
  };
};
