import { useBreakpointObserver } from "hooks/useBreakpointObserver/useBreakpointObserver";
import { useEffect, useState } from "react";
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
