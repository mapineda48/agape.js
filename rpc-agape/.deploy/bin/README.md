# Configuración inicial para el despliegue

Este documento proporciona las instrucciones necesarias para preparar el entorno de despliegue de la aplicación `agape-app` en la web. Se requiere la instalación de varias herramientas de línea de comandos y configuraciones previas antes de iniciar el despliegue.

## Prerrequisitos

Antes de proceder, asegúrate de tener una cuenta activa en Microsoft Azure. Si no tienes una, puedes crearla desde [aquí](https://azure.microsoft.com/en-us/free/).

## Herramientas necesarias

### Terraform

**Uso:** Terraform se utiliza para crear, modificar y versionar infraestructura de forma segura y eficiente.

**Instalación:** El script de Bash adjunto automatiza la instalación de Terraform en tu sistema Windows, añadiéndolo al PATH para su fácil acceso desde cualquier terminal.

### kubectl

**Uso:** kubectl es la herramienta de línea de comandos para interactuar con clusters de Kubernetes, permitiendo gestionar las aplicaciones desplegadas, inspeccionar y manejar recursos del cluster, y más.

**Instalación:** Utiliza el script de Bash proporcionado para descargar y configurar kubectl automáticamente en tu sistema.

### Azure CLI (az-cli)

**Uso:** Azure CLI es una herramienta de línea de comandos proporcionada por Microsoft que permite gestionar recursos de Azure de manera eficiente, facilitando la automatización de tareas a través de scripts.

**Instalación:** Sigue las instrucciones del script de Bash incluido para instalar az-cli en tu máquina.

## Configuración de Azure CLI

Una vez instalada la Azure CLI, es necesario autenticarse para interactuar con tu cuenta de Azure. Para ello, abre una terminal y ejecuta el siguiente comando:

```bash
az login
```

Esto abrirá una ventana en tu navegador para que inicies sesión con tu cuenta de Microsoft Azure. Sigue las instrucciones en pantalla para autenticarte.

## Continuar con el despliegue

Una vez configurado tu entorno con las herramientas necesarias y autenticado en Azure, estás listo para proceder con el despliegue de `agape-app`. Puedes continuar con el proceso dando clic en el enlace de [aquí](#).