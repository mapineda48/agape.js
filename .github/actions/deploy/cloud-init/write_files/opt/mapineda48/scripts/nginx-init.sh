#!/bin/bash
# ===============================================================
# Initialize Nginx Proxy Configuration
# - Storage: only certificates (certs/acme)
# - Local disk: configuration from repo (vhost.d/html)
# ===============================================================

set -e

NGINX_CONF_SRC="/opt/mapineda48/nginx-conf"
NGINX_STORAGE="/mnt/deploy/vm/agape.js/docker"  # Storage: certs/acme only
NGINX_LOCAL="/var/lib/mapineda48/nginx"          # Local disk: vhost.d/html

# Domain is substituted by cloud-init template
DOMAIN="${AGAPE_FQDN}"

echo "🔧 Initializing Nginx proxy configuration..."
echo "   Domain: ${DOMAIN:-'(not set)'}"

# Wait for blobfuse2 mount (needed for certs)
until mountpoint -q /mnt/deploy; do
    echo "⏳ Waiting for /mnt/deploy to be mounted..."
    sleep 2
done

# Create storage directories (persistent across redeploys)
echo "📁 Creating storage directories for certificates..."
mkdir -p "${NGINX_STORAGE}/certs"
mkdir -p "${NGINX_STORAGE}/acme"

# Create local directories (recreated on each deploy)
echo "📁 Creating local directories for nginx config..."
mkdir -p "${NGINX_LOCAL}/vhost.d"
mkdir -p "${NGINX_LOCAL}/html"

# Copy default vhost configuration (for unknown hosts)
if [ -f "${NGINX_CONF_SRC}/vhost.d/default" ]; then
    echo "📁 Copying default vhost configuration..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default" "${NGINX_LOCAL}/vhost.d/default"
fi

# Copy and rename security headers to domain-specific file
# nginx-proxy uses the VIRTUAL_HOST name as the config file name
if [ -f "${NGINX_CONF_SRC}/vhost.d/default.conf" ] && [ -n "$DOMAIN" ]; then
    echo "📁 Creating domain-specific configuration for ${DOMAIN}..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default.conf" "${NGINX_LOCAL}/vhost.d/${DOMAIN}"
else
    echo "⚠️ Warning: DOMAIN not set or default.conf not found"
    echo "   Security headers will not be applied to the main domain"
fi

# Copy location overrides for the domain
if [ -f "${NGINX_CONF_SRC}/vhost.d/default_location" ] && [ -n "$DOMAIN" ]; then
    echo "📁 Creating domain-specific location overrides for ${DOMAIN}..."
    cp -v "${NGINX_CONF_SRC}/vhost.d/default_location" "${NGINX_LOCAL}/vhost.d/${DOMAIN}_location"
fi

# Copy html files (default page for unknown hosts)
if [ -d "${NGINX_CONF_SRC}/html" ]; then
    echo "📁 Copying html files..."
    cp -rv "${NGINX_CONF_SRC}/html/"* "${NGINX_LOCAL}/html/" 2>/dev/null || true
fi

# Set permissions
chmod -R 755 "${NGINX_LOCAL}"

echo "✅ Nginx proxy configuration initialized successfully!"
echo ""
echo "📦 Storage (persistent):"
ls -la "${NGINX_STORAGE}/" 2>/dev/null || echo "   (not accessible)"
echo ""
echo "💾 Local disk (vhost.d):"
ls -la "${NGINX_LOCAL}/vhost.d/" 2>/dev/null || echo "   (empty)"
echo ""
echo "💾 Local disk (html):"
ls -la "${NGINX_LOCAL}/html/" 2>/dev/null || echo "   (empty)"
