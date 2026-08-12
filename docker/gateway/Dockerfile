FROM php:8.3-cli

RUN docker-php-ext-install mysqli \
  && pecl install redis \
  && docker-php-ext-enable redis

WORKDIR /var/www/csakt
COPY . /var/www/csakt

EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "."]
