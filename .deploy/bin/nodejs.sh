#!/bin/bash

# Definir la URL del archivo tar.xz
NODE_URL="https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.xz"

# Definir el directorio donde se instalará Node
NODE_DIR="/usr/local/nodejs"

# Crear el directorio si no existe
sudo mkdir -p $NODE_DIR

# Cambiar al directorio de instalación
cd $NODE_DIR

# Descargar Node.js
echo "Descargando Node.js..."
sudo wget $NODE_URL

# Extraer el archivo
echo "Extrayendo Node.js..."
sudo tar -xJf node-v20.12.2-linux-x64.tar.xz
sudo rm node-v20.12.2-linux-x64.tar.xz

# Agregar Node al PATH de manera global
echo "Exportando la ruta de Node.js en el PATH globalmente..."
echo "export PATH=$NODE_DIR/node-v20.12.2-linux-x64/bin:\$PATH" | sudo tee -a /etc/profile

# Limpiar el cache del shell para actualizar el PATH
hash -r

echo "Instalación completada. Node.js está ahora disponible para todos los usuarios."
