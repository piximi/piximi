#!/bin/bash

pnpm eslint --max-warnings 0 --debug "$@" 2>&1 | grep  "eslint:eslint Lint " | awk '{print $NF}' | while IFS= read -r line; do
    printf "\033[K" # clear from cursor to end of line
    echo $line
    printf "\033[F" # cursor beginning of preivous line
    sleep 0.01  # Adjust speed of updates
done