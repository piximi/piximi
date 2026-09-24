import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import disableAutofix from "eslint-plugin-disable-autofix";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { importX } from "eslint-plugin-import-x";

import type { Linter } from "eslint";

export default tseslint.config(
  js.configs.recommended,

  ...tseslint.configs.recommended,

  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    plugins: {
      "disable-autofix": disableAutofix,
    },
    // Prevents var --> const autofix when formating on save (annoting when habitually save-formatting before re-assignment)
    rules: {
      "prefer-const": "off",
      "disable-autofix/prefer-const": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,jsx,ts,mts,tsx}"],
    extends: [
      importX.flatConfigs.recommended as Linter.Config,
      importX.flatConfigs.typescript as Linter.Config,
    ],
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
      // JS
      "no-useless-assignment": "off",
      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
      // REACT
      "react/display-name": "off",
      "react/prop-types": "off",
      //TYPESCRIPT
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
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // IMPORT-X
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
            // React always first among externals
            { pattern: "react", group: "external", position: "before" },
            { pattern: "react-*", group: "external", position: "before" },
            { pattern: "react-redux", group: "external", position: "before" },
            // @mui always last among externals
            { pattern: "@mui/**", group: "external", position: "after" },

            // Domain layer — foundational, everything else depends on it (253 imports)
            { pattern: "core/**", group: "internal", position: "before" },
            { pattern: "core", group: "internal", position: "before" },

            // Internal hooks — first internal group
            { pattern: "hooks/**", group: "internal", position: "before" },
            { pattern: "hooks", group: "internal", position: "before" },

            { pattern: "contexts/**", group: "internal", position: "before" },
            { pattern: "contexts", group: "internal", position: "before" },

            // Internal components — before other internals
            { pattern: "components/**", group: "internal", position: "before" },
            { pattern: "components", group: "internal", position: "before" },

            // Redux store
            { pattern: "store/**", group: "internal" },
            { pattern: "store", group: "internal" },

            // Utils
            { pattern: "utils/**", group: "internal", position: "after" },
            { pattern: "utils", group: "internal", position: "after" },

            // Etc. (data, icons, images, themes, etc.)
            { pattern: "data/**", group: "internal", position: "after" },
            { pattern: "data", group: "internal", position: "after" },
            { pattern: "icons/**", group: "internal", position: "after" },
            { pattern: "icons", group: "internal", position: "after" },
            { pattern: "images/**", group: "internal", position: "after" },
            { pattern: "images", group: "internal", position: "after" },
            { pattern: "themes/**", group: "internal", position: "after" },
            { pattern: "themes", group: "internal", position: "after" },
            {
              pattern: "translations/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "translations",
              group: "internal",
              position: "after",
            },

            // View-local absolute imports — closest thing you have to relative imports
            { pattern: "views/**", group: "internal", position: "after" },
            {
              pattern: "@ProjectViewer/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@ImageViewer/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@MeasurementViewer/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "react-*"],
          sortTypesGroup: true,
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
              from: "./src/views/ProjectViewer/**/*",
              message: "Viewers can not import from other views",
            },
            {
              target: "./src/views/!(ImageViewer)/**/*",
              from: "./src/views/ImageViewer/**/*",
              message: "Viewers can not import from other views",
            },
            {
              target: "./src/views/!(MeasurementViewer)/**/*",
              from: "./src/views/MeasurementViewer/**/*",
              message: "Viewers can not import from other views",
            },
            {
              target: "./src/!(core)/**/*",
              from: "./src/core/entities/!(index).*",
              message: "Import entities through core/entities.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/store/productionStore.ts",
      "src/store/listeners.ts",
      "src/store/rootReducer.ts",
      "src/store/types.ts",
      "src/app/Application.tsx",
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
    ignores: ["**/*.json", "**/*.yml", "dist/**/*"],
  },

  // must be last
  eslintPluginPrettierRecommended,
);
