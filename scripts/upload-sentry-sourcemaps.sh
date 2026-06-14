#!/usr/bin/env sh
set -eu

if ! command -v sentry-cli >/dev/null 2>&1; then
  echo "sentry-cli is required. Install it in the build environment before uploading sourcemaps." >&2
  exit 1
fi

: "${SENTRY_RELEASE:?SENTRY_RELEASE is required and must match the frontend Sentry release.}"

SENTRY_ORG="${SENTRY_ORG:-rainbond}"
SENTRY_PROJECT="${SENTRY_PROJECT:-rainbond-ui}"
SENTRY_DIST_DIR="${SENTRY_DIST_DIR:-dist}"

if [ -n "${SENTRY_URL_PREFIX:-}" ]; then
  URL_PREFIX="$SENTRY_URL_PREFIX"
elif [ "${SEPARATION:-}" = "true" ]; then
  URL_PREFIX="~"
else
  URL_PREFIX="~/static/dists"
fi

sentry-cli --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" releases new "$SENTRY_RELEASE" || true
sentry-cli --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" releases files "$SENTRY_RELEASE" upload-sourcemaps "$SENTRY_DIST_DIR" --url-prefix "$URL_PREFIX" --rewrite --validate
sentry-cli --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" releases finalize "$SENTRY_RELEASE"
