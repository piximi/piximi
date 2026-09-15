#!/bin/bash
set -euo pipefail

# Lint the given paths, or all of src/ when called with no arguments.
# Exits non-zero when ESLint reports any error or warning.
pnpm exec eslint --max-warnings 0 "${@:-src/}"
