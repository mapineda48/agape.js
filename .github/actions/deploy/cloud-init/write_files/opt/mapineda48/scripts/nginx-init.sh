#!/bin/bash
# ===============================================================
# Initialize Nginx Proxy Configuration
# Copies configuration files to the mounted storage volume
# ===============================================================

set -e

NGINX_CONF_SRC="/opt/mapineda48/nginx-conf"
NGINX_CONF_DST="/mnt/deploy/vm/agape.js/docker"

# Domain is substituted by cloud-init template
DOMAIN="${AGAPE_FQDN}"

echo "🔧 Initializing Nginx proxy configuration..."
echo "   Domain: ${DOMAIN:-'(not set)'}"

# Wait for blobfuse2 mount
until mountpoint -q /mnt/deploy; do
    echo "⏳ Waiting for /mnt/deploy to be mounted..."
    sleep 2
done

# Create destination directories
mkdir -p "${NGINX_CONF_DST}/vhost.d"
mkdir -p "${NGINX_CONF_DST}/html"
mkdir -p "${NGINX_CONF_DST}/certs"
mkdir -p "${NGINX_CONF_DST}/acme"

# Copy default vhost configuration (for unknown hosts)
if [ -f "${NGINX_CONF_SRC}/vhost.d/default" ]; then
    echo "📁 Copying default vhost configuration..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default" "${NGINX_CONF_DST}/vhost.d/default"
fi

# Copy and rename security headers to domain-specific file
# nginx-proxy uses the VIRTUAL_HOST name as the config file name
if [ -f "${NGINX_CONF_SRC}/vhost.d/default.conf" ] && [ -n "$DOMAIN" ]; then
    echo "📁 Creating domain-specific configuration for ${DOMAIN}..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default.conf" "${NGINX_CONF_DST}/vhost.d/${DOMAIN}"
else
    echo "⚠️ Warning: DOMAIN not set or default.conf not found"
    echo "   Security headers will not be applied to the main domain"
fi

# Copy location overrides for the domain
if [ -f "${NGINX_CONF_SRC}/vhost.d/default_location" ] && [ -n "$DOMAIN" ]; then
    echo "📁 Creating domain-specific location overrides for ${DOMAIN}..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default_location" "${NGINX_CONF_DST}/vhost.d/${DOMAIN}_location"
fi

# Copy html files (default page for unknown hosts)
if [ -d "${NGINX_CONF_SRC}/html" ]; then
    echo "📁 Copying html files..."
    cp -rv "${NGINX_CONF_SRC}/html/"* "${NGINX_CONF_DST}/html/" 2>/dev/null || true
fi

# Set permissions
chown -R root:docker "${NGINX_CONF_DST}" 2>/dev/null || true
chmod -R 755 "${NGINX_CONF_DST}"

echo "✅ Nginx proxy configuration initialized successfully!"
echo "   - vhost.d:"
ls -la "${NGINX_CONF_DST}/vhost.d/" 2>/dev/null || echo "     (empty)"
echo "   - html:"
ls -la "${NGINX_CONF_DST}/html/" 2>/dev/null || echo "     (empty)"
