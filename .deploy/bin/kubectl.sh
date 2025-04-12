#!/bin/bash

# Definir el directorio donde se instalará kubectl
KUBECTL_DIR="/usr/local/bin"

# Descargar la última versión estable de kubectl
echo "Descargando kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Mover kubectl al directorio de binarios
sudo mv kubectl $KUBECTL_DIR

# Dar permisos de ejecución a kubectl
sudo chmod +x $KUBECTL_DIR/kubectl

# Verificar la instalación
kubectl version --client

echo "Instalación completada. kubectl está ahora disponible para todos los usuarios."
