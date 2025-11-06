#!/bin/sh
# Set default backend URL if not provided
# In Railway, backend typically runs on port 5000 or the PORT env var from Railway
# Use BACKEND_PORT if set, otherwise default to 5000
export BACKEND_PORT=${BACKEND_PORT:-8080}
export BACKEND_URL=${BACKEND_URL:-http://backend.railway.internal:${BACKEND_PORT}}

# Substitute environment variables in nginx config
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Print the final nginx config (first 50 lines)
echo "=== Nginx Configuration (first 50 lines) ==="
head -50 /etc/nginx/conf.d/default.conf
echo "=== Backend URL: ${BACKEND_URL} ==="

# Start nginx
nginx -g 'daemon off;'
