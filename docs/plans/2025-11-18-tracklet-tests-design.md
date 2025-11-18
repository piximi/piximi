# Tracklet Operations Test Design

**Date:** 2025-11-18
**Branch:** time-series
**Target File:** `src/store/data/dataSlice.test.ts`

## Overview

This design document specifies comprehensive test coverage for tracklet operations in the Redux data slice. Tracklets link annotations across time-series images, enabling features like cell tracking, division tracking, and temporal analysis.

## Context

The `dataSlice` currently has complete test coverage for:
- Kind operations
- Category operations
- Metadata and Image operations
- Annotation operations

However, tracklet operations (lines 288-374 in dataSlice.ts) are currently untested except for one small deletion test. This gap leaves critical time-series functionality without validation.

## Test Organization Approach

**Selected Strategy:** Comprehensive Mirror

The tracklet tests will follow the exact organizational pattern established by existing entity tests (Kind, Category, Metadata, Image, Annotation). This maintains consistency and makes the test file easy to navigate.

## Test Structure

### Location
Insert new `describe("Tracklet Operations")` block after "Annotation Operations" (around line 955) and before "Utility Operations".

### Organization
```typescript
describe("Tracklet Operations", () => {
  beforeEach(() => { /* setup */ });

  describe("Basic CRUD", () => { /* 6 tests */ });
  describe("Annotation Linking", () => { /* 6 tests */ });
  describe("Parent/Child Relationships", () => { /* 5 tests */ });
  describe("Complex Operations", () => { /* 6 tests */ });
  describe("Batch Operations", () => { /* 4 tests */ });
  describe("Edge Cases & Error Handling", () => { /* 4 tests */ });
});
```

## Mock Data & Setup

### Mock Factory Function

Add near line 125 with other mock factories:

```typescript
const createMockTracklet = (overrides: Partial<Tracklet> = {}): Tracklet => ({
  id: "tracklet1",
  metadataId: "meta1",
  color: "#FF0000",
  start: 0,
  end: 2,
  linkedIds: [],
  ...overrides,
});
```

### BeforeEach Setup

Tracklet tests require time-series data:

```typescript
beforeEach(() => {
  // Create annotation kind
  const { kind: annotationKind, unknownCategory } = createMockKind({
    id: "annotation-kind"
  });
  store.dispatch(dataSlice.actions.addKind({ kind: annotationKind, unknownCategory }));

  // Create time-series metadata with 3+ timepoint images
  const metadata = createMockImageMetadata({
    timeSeries: true,
    imageDataIds: ["img0", "img1", "img2"]
  });
  const images = [
    createMockImageData({ id: "img0", timepoint: 0, metadataId: "meta1" }),
    createMockImageData({ id: "img1", timepoint: 1, metadataId: "meta1" }),
    createMockImageData({ id: "img2", timepoint: 2, metadataId: "meta1" }),
  ];
  store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));
});
```

## Test Coverage Breakdown

### 1. Basic CRUD (6 tests)

#### should add a tracklet
- Create tracklet with 2-3 linkedIds
- Verify exists in `state.tracklets.entities`
- Verify added to `state.relationships.metadataToTracklets[metadataId]`
- Verify linked annotations have `trackId` set

#### should update tracklet color
- Add tracklet, then update color
- Verify `state.tracklets.entities[id].color` updated

#### should delete a tracklet
- Add tracklet with linked annotations
- Delete tracklet
- Verify removed from entities
- Verify annotations' `trackId` cleared (cascade)
- Verify removed from metadataToTracklets relationship
- Verify parent/child relationships cleaned up

#### should handle deletion of non-existent tracklet gracefully
- Try to delete non-existent ID
- Should not throw

### 2. Annotation Linking (6 tests)

#### should add annotation to tracklet
- Create tracklet with annotations at timepoints 0 and 1
- Add annotation at timepoint 2
- Verify added to `linkedIds`
- Verify annotation's `trackId` updated
- Verify tracklet `start`/`end` auto-updated to 0-2

#### should not add annotation at duplicate timepoint
- Create tracklet with annotation at timepoint 1
- Try to add another annotation at timepoint 1
- Verify second annotation NOT added
- Verify `linkedIds` length unchanged
- *Tests line 102-109 in trackletCascades.ts*

#### should not add annotation already in tracklet
- Create tracklet with annotation
- Try to add same annotation again
- Verify console.error called
- Verify `linkedIds` unchanged
- *Tests line 96 in trackletCascades.ts*

#### should remove annotation from tracklet
- Create tracklet with 3 annotations (timepoints 0, 1, 2)
- Remove middle annotation (timepoint 1)
- Verify removed from `linkedIds`
- Verify annotation's `trackId` cleared
- Verify tracklet still exists
- Verify `start`/`end` still correct (0 to 2)

#### should delete tracklet when removing last annotation
- Create tracklet with single annotation
- Remove that annotation
- Verify tracklet deleted entirely
- *Tests line 141-143 in trackletCascades.ts*

#### should recalculate start/end when removing boundary annotation
- Create tracklet spanning timepoints 0, 1, 2, 3
- Remove annotation at timepoint 0 (start boundary)
- Verify `start` updated to 1
- Repeat for removing `end` boundary (timepoint 3)
- *Tests line 146-158 in trackletCascades.ts*

### 3. Parent/Child Relationships (5 tests)

#### should add children to tracklet
- Create parent and two child tracklets
- Dispatch `addChildrenToTracklet` with both child IDs (array)
- Verify parent's `children` contains both IDs
- Verify each child's `parents` contains parent ID
- Test single child ID (string) as well

#### should remove children from tracklet
- Create parent with 3 children
- Remove 2 children
- Verify parent's `children` only contains remaining child
- Verify removed children's `parents` updated

#### should add parents to tracklet
- Create child and two parents
- Dispatch `addParentsToTracklet`
- Verify child's `parents` contains both parent IDs
- Verify each parent's `children` contains child ID

#### should remove parents from tracklet
- Create child with 3 parents
- Remove 2 parents
- Verify child's `parents` only contains remaining parent
- Verify removed parents' `children` updated

### 4. Complex Operations (6 tests)

#### should join tracklets into single tracklet
- Create 3 tracklets:
  - A: timepoints 0-2
  - B: timepoints 3-5
  - C: timepoints 6-8
- Join all 3
- Verify new tracklet created with all annotations
- Verify new tracklet spans 0-8
- Verify original 3 deleted
- Verify all annotations have new tracklet ID

#### should preserve parent relationships when joining tracklets
- Create parent P and children A, B
- Join A and B into AB
- Verify AB is child of P
- Verify P's children updated
- *Tests line 204-208 in trackletCascades.ts*

#### should preserve child relationships when joining tracklets
- Create child C and parents A, B
- Join A and B
- Verify new tracklet AB is parent of C
- Verify C's parents updated
- *Tests line 237-242 in trackletCascades.ts*

#### should sever tracklet at timepoint
- Create tracklet spanning 0-10
- Sever at timepoint 5
- Verify original deleted
- Verify two new tracklets created:
  - Left: timepoints 0-4
  - Right: timepoints 5-10
- Verify annotations distributed by timepoint

#### should not sever at boundary timepoints
- Create tracklet spanning 0-5
- Try to sever at start (0) and end (5)
- Verify nothing happens
- *Tests line 265 guard in trackletCascades.ts*

#### should transfer parent/child relationships when severing
- Create tracklet with parents and children
- Sever in middle
- Verify left tracklet inherits parents
- Verify right tracklet inherits children
- *Tests lines 295-305 in trackletCascades.ts*

### 5. Batch Operations (4 tests)

#### should batch add tracklets
- Create 3 tracklet objects
- Dispatch `batchAddTracklet`
- Verify all 3 exist in entities
- Verify all added to metadataToTracklets

#### should batch add annotations to tracklet
- Create tracklet and 5 annotations
- Dispatch `batchAddAnnotationToTracklet`
- Verify all annotations added
- Verify all have correct `trackId`
- Verify `start`/`end` span entire range

#### should batch add annotations to multiple tracklets
- Create 2 tracklets
- Batch add different annotations to each
- Verify each received correct annotations
- *Tests line 515-522 forEach logic*

#### should batch delete tracklets
- Create 5 tracklets
- Delete 3 of them
- Verify those 3 deleted, others remain
- Verify cascade cleanup (annotations' trackId cleared)

### 6. Edge Cases & Error Handling (4 tests)

#### should handle operations on non-existent tracklet gracefully
- Try `updateTrackletColor` on non-existent ID
- Try `addAnnotationToTracklet` on non-existent ID
- Try `removeAnnotationFromTracklet` on non-existent ID
- Verify no errors thrown

#### should handle empty tracklet after all annotations removed
- Create tracklet with 3 annotations
- Remove all 3 one by one
- Verify tracklet auto-deleted after last removal
- Verify metadata relationship cleaned up

#### should maintain relationship consistency during complex cascade
- Create graph: parent → tracklet with annotations → children
- Delete middle tracklet
- Verify parent's children updated
- Verify children's parents updated
- Verify annotations' trackId cleared
- Verify metadata relationship cleaned up

#### should handle join with non-contiguous tracklets
- Create tracklets at 0-2, 5-7, 10-12 (gaps)
- Join all three
- Verify single tracklet spanning 0-12
- Verify all annotations transferred

## Test Count Summary

- Basic CRUD: 6 tests
- Annotation Linking: 6 tests
- Parent/Child Relationships: 5 tests
- Complex Operations: 6 tests
- Batch Operations: 4 tests
- Edge Cases: 4 tests

**Total: 31 new tests**

## Key Validations

Each test validates appropriate state consistency:

1. **Entity state**: Tracklet exists/deleted in `state.tracklets.entities`
2. **Relationship tracking**: `metadataToTracklets` index updated
3. **Bidirectional links**: Annotation `trackId` ↔ tracklet `linkedIds`
4. **Parent/child bidirectionality**: Parent `children` ↔ child `parents`
5. **Automatic fields**: `start`/`end` auto-calculated from annotations
6. **Cascade cleanup**: Deleting tracklets clears annotation references

## Implementation Notes

- Follow existing test patterns precisely (use of `beforeEach`, `getState()`, selectors)
- Use `vi.spyOn(console, 'error')` for error handling tests (see line 248, 311, etc.)
- Dispose tensors in cleanup if needed (though tracklets don't own tensors directly)
- All tests should be independent (no shared mutable state between tests)

## Success Criteria

- All 31 tests pass
- Coverage includes all tracklet actions (lines 288-374 in dataSlice.ts)
- All cascade operations tested (trackletCascades.ts)
- Edge cases and error conditions handled
- Test structure mirrors existing pattern exactly
