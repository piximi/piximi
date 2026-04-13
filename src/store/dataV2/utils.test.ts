import { describe, expect, it } from "vitest";
import { moveRelationship } from "./utils";

describe("moveRelationship", () => {
  it("does not throw when newParentKey is absent", () => {
    const map: Record<string, { ids: string[] }> = {
      parent1: { ids: ["a"] },
    };
    // newParentKey "parent2" doesn't exist — should not throw
    expect(() =>
      moveRelationship(map, "ids", "a", "parent1", "parent2")
    ).not.toThrow();
  });

  it("removes id from old parent and adds to new parent", () => {
    const map: Record<string, { ids: string[] }> = {
      parent1: { ids: ["a", "b"] },
      parent2: { ids: ["c"] },
    };
    moveRelationship(map, "ids", "a", "parent1", "parent2");
    expect(map["parent1"].ids).toEqual(["b"]);
    expect(map["parent2"].ids).toEqual(["c", "a"]);
  });
});
