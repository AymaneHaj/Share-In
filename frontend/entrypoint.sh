#!/bin/sh
# Set default backend URL if not provided
export BACKEND_URL=${BACKEND_URL:-http://backend.railway.internal:${PORT:-8080}}

# Substitute environment variables in nginx config
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g 'daemon off;'
