#!/usr/bin/env bash
# Keeps the production start-up rules honest (npm run check:env:production, in CI).
# Uses made-up example values only: nothing here is a real host or credential.
#   1. A complete production environment must pass.
#   2. A production environment missing required settings must fail.
#   3. A production environment pointing at a local database must fail.
#   4. A production environment with the development sign-in enabled must fail.
set -uo pipefail
cd "$(dirname "$0")/.."
check() { env -i PATH="$PATH" HOME="${HOME:-/tmp}" "$@" npm run --silent check:env >/dev/null 2>&1; }
fail=0

if check NODE_ENV=production APP_URL=https://app.example.com DATABASE_URL=postgres://ci@db.example.com:5432/app; then
  echo "✓ complete production environment accepted"
else
  echo "✗ complete production environment was rejected"; fail=1
fi

if check NODE_ENV=production; then
  echo "✗ production environment with missing settings was accepted"; fail=1
else
  echo "✓ production environment with missing settings rejected"
fi

if check NODE_ENV=production APP_URL=https://app.example.com DATABASE_URL=postgres://ci@localhost:5432/app; then
  echo "✗ production environment with a local database was accepted"; fail=1
else
  echo "✓ production environment with a local database rejected"
fi

if check NODE_ENV=production APP_URL=https://app.example.com DATABASE_URL=postgres://ci@db.example.com:5432/app DEV_IDENTITY=enabled; then
  echo "✗ production environment with the development sign-in was accepted"; fail=1
else
  echo "✓ production environment with the development sign-in rejected"
fi

exit $fail
