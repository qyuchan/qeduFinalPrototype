#!/bin/sh
set -e

# Clear any config cached from build time so runtime env vars (set by Render) take effect
php artisan config:clear

# Safe to run on every boot — Laravel skips migrations that already ran
php artisan migrate --force

# Symlink storage/app/public -> public/storage if not already present (survives ephemeral
# disk resets since it's recreated on every container start)
[ -L public/storage ] || php artisan storage:link

# Render assigns the port to listen on via $PORT
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
