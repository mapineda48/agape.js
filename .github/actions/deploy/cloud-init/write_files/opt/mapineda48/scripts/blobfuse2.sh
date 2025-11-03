#!/bin/bash
TIMEOUT=60  # segundos
elapsed=0

echo "Esperando que Blobfuse2 se monte (máx ${TIMEOUT}s)..."
until systemctl is-active --quiet mapineda48-blobfuse2.service; do
    sleep 1
    ((elapsed++))
    if (( elapsed >= TIMEOUT )); then
    echo "❌ Tiempo agotado esperando blobfuse2"
    systemctl status mapineda48-blobfuse2.service
    exit 1
    fi
done

echo "✅ Blobfuse2 activo después de ${elapsed}s"

# # Crear grupo fuse si no existe y agregar usuario a grupos necesarios
# groupadd --system fuse || true
# usermod -aG docker azureuser
# usermod -aG fuse azureuser

# # Crear punto de montaje
# chown azureuser:docker /mnt/deploy
# chmod 775 /mnt/deploy

# # Crear carpetas necesarias
# mkdir -p /mnt/deploy/vm/agape.js/docker/certs
# mkdir -p /mnt/deploy/vm/agape.js/docker/vhost.d
# mkdir -p /mnt/deploy/vm/agape.js/docker/html

# # Permisos para que grupo docker acceda a los volúmenes
# chown -R azureuser:docker /mnt/deploy/vm/agape.js
# chmod -R 775 /mnt/deploy/vm/agape.js