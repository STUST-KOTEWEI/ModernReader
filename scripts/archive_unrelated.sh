#!/usr/bin/env bash
set -euo pipefail

# Archive large, non-release files and folders to ops/archives and remove originals
# SAFE: script checks existence and verifies tar exit code before deleting originals.

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE_DIR="${PROJECT_ROOT}/ops/archives"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
HOST=$(hostname -s)
ARCHIVE_NAME="cleanup-${TIMESTAMP}-${HOST}.tar.gz"

declare -a CANDIDATES=(
  "${PROJECT_ROOT}/backend/.venv"
  "${PROJECT_ROOT}/.venv"
  "${PROJECT_ROOT}/backend/.venv310"
  "${PROJECT_ROOT}/.mypy_cache"
  "${PROJECT_ROOT}/clients/apple/.build"
  "${PROJECT_ROOT}/clients/apple/ModernReaderApp/build"
  "${PROJECT_ROOT}/frontend/node_modules"
)

mkdir -p "${ARCHIVE_DIR}"

echo "Archive target: ${ARCHIVE_DIR}/${ARCHIVE_NAME}"

TO_ARCHIVE=()
for p in "${CANDIDATES[@]}"; do
  if [ -e "$p" ]; then
    TO_ARCHIVE+=("$p")
  fi
done

if [ ${#TO_ARCHIVE[@]} -eq 0 ]; then
  echo "No candidate folders found to archive. Exiting.";
  exit 0
fi

echo "Found ${#TO_ARCHIVE[@]} items to archive:";
for p in "${TO_ARCHIVE[@]}"; do echo " - $p"; done

pushd "${PROJECT_ROOT}" >/dev/null

echo "Creating archive... (this may take a while)"
tar -czf "${ARCHIVE_DIR}/${ARCHIVE_NAME}" "${TO_ARCHIVE[@]}"
TAR_EXIT=$?

if [ $TAR_EXIT -ne 0 ]; then
  echo "Tar failed with code ${TAR_EXIT}. Archive not complete. Aborting cleanup." >&2
  exit 2
fi

echo "Archive created successfully: ${ARCHIVE_DIR}/${ARCHIVE_NAME}"

echo "Verifying archive size and then removing originals..."
ls -lh "${ARCHIVE_DIR}/${ARCHIVE_NAME}"

for p in "${TO_ARCHIVE[@]}"; do
  echo "Removing $p ..."
  rm -rf "$p"
done

echo "Cleanup complete. Freed space from archived folders. Archive kept at: ${ARCHIVE_DIR}/${ARCHIVE_NAME}"

popd >/dev/null

exit 0
