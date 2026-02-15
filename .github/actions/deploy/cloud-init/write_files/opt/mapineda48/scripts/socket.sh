#!/bin/bash

IMAGE="mapineda48/agape.js:develop"
SERVICE="agape-app"
COMPOSE_DIR="/opt/mapineda48/compose"

function deploy_dockerhub() {
    # El código de despliegue DEBE manejar sus propios errores o set -e lo detendrá.
    
    # Muestra los parámetros en el journal de systemd (en stderr)
    echo "Iniciando despliegue: IMAGE=$IMAGE SERVICE=$SERVICE DIR=$COMPOSE_DIR"

    # 1) Pull de la imagen (Redirige la salida a /dev/null, pero mantén el error)
    echo "docker pull $IMAGE"
    docker pull "$IMAGE" >/dev/null

    # 2) Compose rm -sf del servicio
    cd "$COMPOSE_DIR"
    echo "docker compose rm -sf $SERVICE"
    docker compose rm -sf "$SERVICE" >/dev/null

    # 3) Compose up -d del servicio
    echo "docker compose up -d $SERVICE"
    docker compose up -d "$SERVICE" >/dev/null

    # Si llegamos aquí sin que set -e haya fallado, el despliegue es OK.
    echo "dockerhub completado OK"
}

# Read input from the socket and respond
while read cmd; do
    echo "Received: $cmd"  # Log the received message
    
    if [ "$cmd" = "dockerhub" ]; then
        deploy_dockerhub
        exit 0
    fi

    if [ "$cmd" = "ngrok" ]; then
        systemctl start mapineda48-ngrok.service
        exit 0
    fi

    # Respuesta para comandos no reconocidos
    echo "ERROR: Comando no reconocido: $cmd"
done
