import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useUnloadConfirmation = () => {
  const location = useLocation();

  const handleUnload = (e: any) => {
    if (import.meta.env.DEV) {
      return;
    } else {
      e.preventDefault();
      return (e.returnValue = "Are you sure you want to exit?");
    }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/project") return;
    if (!window.history.state?.usr?.from) {
      window.location.replace(window.location.origin);
      return;
    }
    window.history.replaceState(null, "");
  }, []);
};
