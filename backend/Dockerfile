FROM dunglas/frankenphp:1-php8.4-alpine

RUN install-php-extensions bcmath mbstring pdo_mysql zip opcache

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app
COPY . .

RUN set -eu; \
    for attempt in 1 2 3; do \
        composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader && break; \
        if [ "$attempt" -eq 3 ]; then exit 1; fi; \
        sleep 5; \
    done; \
    test -f vendor/autoload.php; \
    mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/agronet-entrypoint
RUN chmod +x /usr/local/bin/agronet-entrypoint

EXPOSE 80

ENTRYPOINT ["agronet-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
