/**
 * Feature flags for gradual rollout of new systems.
 * Set via environment variables or hardcode for development.
 */
export const FEATURE_FLAGS = {
  USE_NEW_PIPELINE: import.meta.env.VITE_USE_NEW_PIPELINE === "true",
} as const;
