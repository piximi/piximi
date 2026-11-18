import { useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { useBackendQuery } from "core/backend/query";

import { selectDataRevision } from "store/backendSync";

import type {
  AnnotationCountGroup,
  AnnotationQuery,
  Counts,
  ImageCountGroup,
  ImageQuery,
} from "core/backend";
import type { Category } from "core/entities";

export const useDataRevision = (): number => useSelector(selectDataRevision);

export const useImageCounts = (
  query: ImageQuery,
  groupBy?: ImageCountGroup,
): Counts | undefined => {
  const backend = useBackend();
  const revision = useDataRevision();
  return useBackendQuery(
    JSON.stringify(["imageCounts", query, groupBy]),
    () => backend.query.imageCounts(query, groupBy),
    revision,
  ).value;
};

export const useAnnotationCounts = (
  query: AnnotationQuery,
  groupBy?: AnnotationCountGroup,
): Counts | undefined => {
  const backend = useBackend();
  const revision = useDataRevision();
  return useBackendQuery(
    JSON.stringify(["annotationCounts", query, groupBy]),
    () => backend.query.annotationCounts(query, groupBy),
    revision,
  ).value;
};

/* How many items carry a category; one request serves a whole kind's list. */
export const useCategoryCount = (category: Category): number => {
  const backend = useBackend();
  const revision = useDataRevision();
  const scope =
    category.type === "image" ? "images" : `kind:${category.kindId}`;
  const { value } = useBackendQuery(
    `countsByCategory:${scope}`,
    () =>
      category.type === "image"
        ? backend.query.imageCounts({}, "category")
        : backend.query.annotationCounts(
            { kindIds: [category.kindId] },
            "category",
          ),
    revision,
  );
  return value?.groups?.[category.id] ?? 0;
};
