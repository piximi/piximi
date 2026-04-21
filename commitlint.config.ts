const WORK_TYPES = ["types", "state", "hook", "component"] as const;

export default {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      parserOpts: {
        headerPattern: /^(\w*)(?:\(([^)]*)\))?(?:\[([^\]]*)\])?: (.*)$/,
        headerCorrespondence: ["type", "scope", "work", "subject"],
      },
    },
  },
  plugins: [
    {
      rules: {
        "header-work-tag": ({ work }: { work?: string }) => {
          if (!work) return [true, ""];
          const valid = (WORK_TYPES as readonly string[]).includes(work);
          return [valid, `[work] must be one of: ${WORK_TYPES.join(", ")}`];
        },
      },
    },
  ],
  rules: {
    "header-work-tag": [2, "always"],
  },
};
