import { DeferredEntity } from "utils/types";

export function getCompleteEntity<T>(entity: DeferredEntity<T>): T | undefined {
  if (entity.changes.deleted) return;
  const {
    added: _added,
    deleted: _deleted,
    ...completeEntity
  } = {
    ...entity.saved,
    ...entity.changes,
  };
  return completeEntity as T;
}
