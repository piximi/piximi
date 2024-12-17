import { useEffect } from "react";

export const useUnloadConfirmation = () => {
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
};
