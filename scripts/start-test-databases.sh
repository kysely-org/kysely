#!/usr/bin/env bash

set -euo pipefail

for attempt in {1..8}; do
  if output=$(docker compose up -d "$@" 2>&1); then
    printf '%s\n' "$output"
    exit 0
  fi

  printf '%s\n' "$output" >&2

  if [[ "$output" != *toomanyrequests* && "$output" != *'Rate exceeded'* ]] || ((attempt == 8)); then
    exit 1
  fi

  delay=$((attempt * 4 + RANDOM % 8))
  printf 'Registry rate limit; retrying database startup (%d/8) in %ds.\n' "$((attempt + 1))" "$delay" >&2
  sleep "$delay"
done
