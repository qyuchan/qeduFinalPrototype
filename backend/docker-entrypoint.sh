#!/bin/sh
set -e

# Clear any config cached from build time so runtime env vars (set by Render) take effect
php artisan config:clear

# Safe to run on every boot — Laravel skips migrations that already ran
php artisan migrate --force

# Symlink storage/app/public -> public/storage if not already present (survives ephemeral
# disk resets since it's recreated on every container start)
[ -L public/storage ] || php artisan storage:link

# Render assigns the port to listen on via $PORT at runtime, so it can't be baked into
# the image at build time. Only $PORT is substituted here — nginx's own $uri /
# $document_root / etc. tokens must stay literal, so the variable list is explicit.
PORT="${PORT:-8000}" envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# PHP-FPM handles the actual request concurrency (multiple worker processes); nginx
# in front of it replaces "php artisan serve", which could only serve one request at
# a time and blocked every other user while it did.
php-fpm -D
exec nginx -g 'daemon off;'
