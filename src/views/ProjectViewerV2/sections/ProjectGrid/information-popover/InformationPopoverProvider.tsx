import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type PopoverState =
  | { itemType: "annotation"; itemId: string; anchorEl: HTMLElement }
  | { itemType: "image"; itemId: string; anchorEl: HTMLElement }
  | { itemType: null; itemId: null; anchorEl: null };

const InformationPopoverContext = createContext<{
  state: PopoverState;
  open: (state: PopoverState) => void;
  close: () => void;
}>({
  state: {
    itemType: null,
    itemId: null,
    anchorEl: null,
  },
  open: (_state) => {},
  close: () => {},
});

export function InformationPopoverProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [popoverState, setPopoverState] = useState<PopoverState>({
    itemType: null,
    itemId: null,
    anchorEl: null,
  });

  const open = useCallback((state: PopoverState) => setPopoverState(state), []);
  const close = useCallback(
    () => setPopoverState({ itemType: null, itemId: null, anchorEl: null }),
    [],
  );

  const value = useMemo(
    () => ({ state: popoverState, open, close }),
    [popoverState, open, close],
  );

  return (
    <InformationPopoverContext.Provider value={value}>
      {children}
    </InformationPopoverContext.Provider>
  );
}

export function useInformationPopover() {
  const context = useContext(InformationPopoverContext);
  return context;
}
