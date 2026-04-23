import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { importX } from "eslint-plugin-import-x";

import type { Linter } from "eslint";

const NEW_FILES = [
  "src/views/ProjectViewerV2/**/*.{js,mjs,jsx,ts,mts,tsx}",
  "src/store/dataV2/*.ts",
  "src/store/classifierV2/*.ts",
  "src/utils/data-connector/**/*.ts",
  "src/utils/file-io-v2/**/*.ts",
  "src/utils/worker-scheduler/**/*.ts",
  "src/utils/workers/**/*.ts",
];
export default tseslint.config(
  js.configs.recommended,

  ...tseslint.configs.recommended,

  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],

  {
    files: ["**/*.{js,mjs,jsx,ts,mts,tsx}"],
    settings: {
      react: { version: "17.0.2" },
      "import-x/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },

    languageOptions: {
      globals: globals.browser, // Define global variables for the browser environment
    },
    rules: {
      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^React$",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
          "ts-nocheck": "allow-with-description",
        },
      ],
    },
  },
  {
    files: NEW_FILES,
    extends: [
      importX.flatConfigs.recommended as Linter.Config,
      importX.flatConfigs.typescript as Linter.Config,
    ],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"], // 4. Relative imports (../Parent, ./Sibling, ./)
            "type",
          ],
          pathGroups: [
            // 2a. React always first among externals
            { pattern: "react", group: "external", position: "before" },
            { pattern: "react-*", group: "external", position: "before" },
            { pattern: "react-redux", group: "external", position: "before" },
            // 2b. @mui always last among externals
            { pattern: "@mui/**", group: "external", position: "after" },

            // 3. Internal hooks — first internal group
            { pattern: "hooks/**", group: "internal", position: "before" },
            { pattern: "hooks", group: "internal", position: "before" },

            { pattern: "workers/**", group: "internal", position: "before" },
            { pattern: "workers", group: "internal", position: "before" },

            { pattern: "contexts/**", group: "internal", position: "before" },
            // 5. Redux store
            { pattern: "store/**", group: "internal" },
            { pattern: "store", group: "internal" },

            // 4. Internal components — before other internals
            { pattern: "components/**", group: "internal", position: "before" },
            { pattern: "components", group: "internal", position: "before" },
            // 6. Types
            // { pattern: "types/**", group: "internal", position: "after" },
            // { pattern: "types", group: "internal", position: "after" },

            // 7. Utils
            { pattern: "utils/**", group: "internal", position: "after" },
            { pattern: "utils", group: "internal", position: "after" },

            // 8. Etc. (data, icons, images, themes, etc.)
            { pattern: "data/**", group: "internal", position: "after" },
            { pattern: "data", group: "internal", position: "after" },
            { pattern: "icons/**", group: "internal", position: "after" },
            { pattern: "images/**", group: "internal", position: "after" },
            { pattern: "themes/**", group: "internal", position: "after" },
            {
              pattern: "translations/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "react-*"],

          "newlines-between": "always",
        },
      ],
      "import-x/no-duplicates": "warn",
      "import-x/no-useless-path-segments": "warn",
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/!(views)/**/*",
              from: "./src/views/**/*",
              message: "Global files can not import from isolated views.",
            },
            {
              target: "./src/views/!(ProjectViewer)/**/*",
              from: "./src/views/!ProjectViewer/**/*",
              message: "Viewers can not import from other views",
            },
            {
              target: "./src/views/!(ImageViewer)/**/*",
              from: "./src/views/!ImageViewer/**/*",
              message: "Viewers can not import from other views",
            },
            {
              target: "./src/views/!(MeasurementViewer)/**/*",
              from: "./src/views/!MeasurementViewer/**/*",
              message: "Viewers can not import from other views",
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      "src/store/productionStore.ts",
      "src/store/rootReducer.ts",
      "src/store/types.ts",
    ],
    rules: {
      "import-x/no-restricted-paths": "off",
    },
  },

  {
    files: ["**/*.stories.{js,jsx,ts,tsx}"],
    rules: {
      "import-x/no-anonymous-default-export": "off",
      "import-x/no-cycle": "error",
    },
    ignores: ["!.storybook"],
  },

  {
    files: ["**/*.{.js,mjs,jsx", "**/*test*", "**/tests/**", "scripts/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },

  {
    ignores: ["**/*.json", "**/*.yml"],
  },

  // must be last
  eslintPluginPrettierRecommended,
);
