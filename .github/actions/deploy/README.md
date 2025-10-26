# Infraestructura Terraform - Azure

Este proyecto define la infraestructura para el entorno `mapineda48.de` en Azure utilizando Terraform.

---

## 📦 Backend remoto en Azure Blob Storage

Este proyecto utiliza un backend remoto para almacenar el estado de Terraform en un contenedor de Azure Blob Storage.

> ⚠️ **Importante:** Los valores sensibles del backend (grupo de recursos, cuenta de almacenamiento, contenedor, etc.) **NO deben estar en los archivos `.tf`**. En su lugar, se configuran mediante un archivo externo `backend.hcl`, el cual debe ser ignorado por Git.

---

## 🚀 Pasos de uso

### 1. Crear tu archivo `backend.hcl`

Crea un archivo llamado `backend.hcl` en la raíz del proyecto (no se debe subir al repositorio). Ejemplo:

```hcl
resource_group_name  = "agape_app-rg"
storage_account_name = "dedvx6qpk12345"
container_name       = "tfstate"
````

### 2. Inicializar Terraform

Ejecuta el siguiente comando para inicializar Terraform con el backend remoto:

```bash
terraform init -backend-config=backend.hcl
terraform init -backend-config=backend.hcl -reconfigure
```

Este comando solo es necesario:

* La primera vez que usas el proyecto
* Si cambia el archivo `backend.hcl`
* Si cambias el backend o proveedor

### 3. Aplicar cambios

Una vez inicializado, puedes ejecutar Terraform normalmente:

```bash
terraform plan
terraform apply
```

No es necesario volver a ejecutar `terraform init` a menos que se modifique el backend.

---

## 🔐 Seguridad

* Asegúrate de agregar `backend.hcl` al archivo `.gitignore` para evitar subir datos sensibles al repositorio.
* Puedes usar un archivo de ejemplo llamado `backend.example.hcl` para compartir la estructura con tu equipo.

### `.gitignore` recomendado:

```gitignore
# Terraform
*.tfstate
*.tfstate.*
.terraform/
terraform.tfvars
crash.log

# Backend config (local y sensible)
backend.hcl
```

---

## 🧠 Buenas prácticas

* Nunca incluyas datos sensibles (claves, nombres de storage, etc.) en archivos `.tf`.
* Usa entornos separados (`dev`, `prod`) con diferentes archivos `backend-*.hcl` y ejecútalos con:

```bash
terraform init -backend-config=backend-dev.hcl
```

---

## 📁 Estructura esperada

```
.
├── main.tf
├── variables.tf
├── outputs.tf
├── backend.example.hcl
├── .gitignore
└── README.md
```

---

## 📎 Referencias

* [Terraform AzureRM Backend](https://developer.hashicorp.com/terraform/language/settings/backends/azurerm)

# Despliegue automático de Blobfuse2 y Docker Compose con cloud-init en Azure

Este entorno monta un contenedor de Azure Blob Storage mediante Blobfuse2, configurado automáticamente con `cloud-init`. También inicia servicios Docker Compose para exponer aplicaciones con Nginx Proxy y ACME Companion.

---

## 🧰 Funcionalidades incluidas

- Instalación automática de Docker y Blobfuse2
- Montaje persistente del contenedor `deploy` en `/mnt/deploy`
- Servicio `systemd` para montaje automático tras cada reinicio
- Docker Compose con Nginx Proxy y ACME
- Persistencia de certificados y configuraciones en Blob Storage

---

## 📁 Estructura de almacenamiento

Se monta en:

```

/mnt/deploy/mapineda48.vm/
├── ngnix/
│   ├── certs/
│   ├── vhost/
│   └── html/.well-known/acme-challenge/
├── acme/

````

---

## 🛠️ Comandos útiles

### 🔄 Montar manualmente Blobfuse2 (solo si no está activo)

```bash
blobfuse2 mount /mnt/deploy --config-file=/etc/blobfuse2.yaml
````

### 🔽 Desmontar Blobfuse2

```bash
sudo fusermount3 -u /mnt/deploy
```

### ✅ Ver estado del servicio

```bash
systemctl status blobfuse2-deploy
```

### 📋 Ver logs del servicio

```bash
journalctl -u blobfuse2-deploy --no-pager -n 50
```

### 📄 Ver logs de `cloud-init`

```bash
cat /var/log/cloud-init.log
cat /var/log/cloud-init-output.log
tail -f /var/log/cloud-init-output.log
```

---

## 🚀 Comandos post-instalación útiles (si aplican)

### Validar que el montaje esté activo

```bash
mount | grep /mnt/deploy
```

---

## 🔄 Reinicio automático

El `cloud-init` finaliza con un `reboot` para aplicar correctamente los grupos (`fuse`, `docker`) y permitir el arranque correcto del servicio en sesiones futuras.

---

## 📝 Notas

* El usuario `azureuser` debe pertenecer a los grupos `docker` y `fuse`.
* El archivo de configuración de Blobfuse2 se encuentra en `/etc/blobfuse2.yaml`.
* El servicio `blobfuse2-deploy.service` está ubicado en `/etc/systemd/system`.

---

## 📂 Ubicación de `docker-compose.yml`

Se encuentra en:

```bash
/opt/agape-app/docker-compose.yml
```

sudo systemctl status mapineda48.socket