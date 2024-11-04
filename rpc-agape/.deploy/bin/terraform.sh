#!/bin/bash

# Definir la URL del archivo zip de Terraform
TERRAFORM_URL="https://releases.hashicorp.com/terraform/1.8.1/terraform_1.8.1_linux_amd64.zip"

# Definir el directorio donde se instalará Terraform
TERRAFORM_DIR="/usr/local/terraform"

# Crear el directorio si no existe
sudo mkdir -p $TERRAFORM_DIR

# Cambiar al directorio de instalación
cd $TERRAFORM_DIR

# Descargar Terraform
echo "Descargando Terraform..."
sudo wget $TERRAFORM_URL

# Extraer el archivo
echo "Extrayendo Terraform..."
sudo unzip terraform_1.8.1_linux_amd64.zip
sudo rm terraform_1.8.1_linux_amd64.zip

# Agregar Terraform al PATH de manera global
echo "Exportando la ruta de Terraform en el PATH globalmente..."
echo "export PATH=$TERRAFORM_DIR:\$PATH" | sudo tee -a /etc/profile

# Limpiar el cache del shell para actualizar el PATH
hash -r

echo "Instalación completada. Terraform está ahora disponible para todos los usuarios."
