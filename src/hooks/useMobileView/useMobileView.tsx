import { useEffect, useState } from "react";

import { useBreakpointObserver } from "../useBreakpointObserver";

import { mobileBreakpoints } from "utils/common/constants";

export const useMobileView = () => {
  const breakpoint = useBreakpointObserver();
  const [isMobile, setIsMobile] = useState(
    mobileBreakpoints.includes(breakpoint)
  );
  useEffect(() => {
    setIsMobile(mobileBreakpoints.includes(breakpoint));
  }, [breakpoint]);

  return isMobile;
};
