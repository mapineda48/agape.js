#!/bin/bash

echo "Esperar a que dockerd esté listo antes de instalar el plugin"
for i in $(seq 1 20); do
    if docker info >/dev/null 2>&1; then break; fi
    sleep 1
done

echo "Instalar el driver de logs de Loki (idempotente)"
if ! docker plugin inspect loki >/dev/null 2>&1; then

    docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions

    # https://grafana.com/docs/loki/latest/send-data/docker-driver/configuration/#supported-log-opt-options
    echo "Es importante habilitar la configuración cuando el plugin este listo"
    mv /etc/docker/daemon.disabled.json /etc/docker/daemon.json

    echo "Reiniciar el daemon docker"
    systemctl daemon-reload
    systemctl enable --now docker

fi