const cancelFns = new Map<string, () => void>();

export const taskCancelRegistry = {
  register(id: string, fn: () => void): void {
    cancelFns.set(id, fn);
  },
  unregister(id: string): void {
    cancelFns.delete(id);
  },
  cancel(id: string): void {
    cancelFns.get(id)?.();
  },
  has(id: string): boolean {
    return cancelFns.has(id);
  },
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => cancelFns.clear());
}
