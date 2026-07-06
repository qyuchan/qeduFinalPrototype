FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev libzip-dev libicu-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql bcmath zip intl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install dependencies first so this layer is cached unless composer files change
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chmod -R 775 storage bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["docker-entrypoint.sh"]
