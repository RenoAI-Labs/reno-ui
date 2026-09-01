#!/usr/bin/env bash
#
# Proves a customer project builds with no connection to reno infrastructure.
#
# Clones the repo into a throwaway directory — so nothing in the working tree,
# no local node_modules, no cached registry response can mask a missing
# dependency — then installs and builds from scratch.
#
# This is the evidence behind the handover claim. Run it before every delivery.
#
# Usage: scripts/verify-selfcontained.sh [project-dir] [git-ref]

set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
GIT_REF="${2:-HEAD}"
NAMESPACE="@reno"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "✘ $PROJECT_DIR is not a git repository. This check must run on a clean clone."
  exit 1
fi

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

echo "→ Cloning $PROJECT_DIR@$GIT_REF into a clean directory"
git clone --quiet --no-hardlinks "$PROJECT_DIR" "$WORK_DIR/project"
git -C "$WORK_DIR/project" checkout --quiet "$GIT_REF"
cd "$WORK_DIR/project"

echo "→ Checking for leftover $NAMESPACE references"
if grep -rn "$NAMESPACE/" \
     --exclude-dir=node_modules --exclude-dir=.git \
     --exclude-dir=.next --exclude-dir=dist --exclude-dir=build . ; then
  echo "✘ Found $NAMESPACE references in the delivered source. Run eject-registry.mjs first."
  exit 1
fi
echo "✔ No $NAMESPACE references"

echo "→ Checking components.json"
# In a monorepo the file sits in the app package, not at the root, so look for
# every copy rather than only ./components.json.
LEFTOVER="$(grep -rl '"registries"' --include=components.json \
              --exclude-dir=node_modules --exclude-dir=.git . || true)"
if [ -n "$LEFTOVER" ]; then
  echo "✘ components.json still declares a registries block:"
  echo "$LEFTOVER" | sed 's/^/    /'
  exit 1
fi
echo "✔ components.json clean"

# Which package manager the customer actually uses. Assuming npm made this check
# fail on the first real monorepo it met (pnpm workspace, no package-lock.json),
# and a handover proof that cannot run is worth nothing.
if [ -f pnpm-lock.yaml ]; then
  PM="pnpm"; INSTALL="pnpm install --frozen-lockfile"
elif [ -f yarn.lock ]; then
  PM="yarn"; INSTALL="yarn install --immutable"
elif [ -f bun.lockb ] || [ -f bun.lock ]; then
  PM="bun"; INSTALL="bun install --frozen-lockfile"
else
  PM="npm"; INSTALL="npm ci --no-audit --no-fund"
fi

if ! command -v "$PM" >/dev/null 2>&1; then
  echo "✘ Lockfile says this project uses $PM, which is not installed here."
  exit 1
fi

echo "→ $INSTALL"
$INSTALL

echo "→ $PM run build"
"$PM" run build

echo
echo "✔ Self-contained: clean clone installs and builds with no reno dependency."
