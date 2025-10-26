#!/usr/bin/env bash
# /usr/local/bin/mapineda48-handler.sh
# Handler seguro para systemd socket-activation.
# Soporta UN solo comando: "dockerbub"
#   - Pull de imagen agape.js:develop
#   - docker compose rm -sf agape-app
#   - docker compose up -d agape-app

set -euo pipefail

# === Configuración (AJUSTABLE) ===
IMAGE="agape.js:develop"
SERVICE="agape-app"
COMPOSE_DIR="/etc/agape.js"
LOCK_FILE="/run/mapineda48-dockerbub.lock"
LOGGER_TAG="mapineda48-handler"

# === Utilidades ===
log_info()  { logger -t "$LOGGER_TAG" "[INFO] $*"; }
log_warn()  { logger -t "$LOGGER_TAG" "[WARN] $*"; }
log_error() { logger -t "$LOGGER_TAG" "[ERROR] $*"; }

# Detectar docker compose (v2 o v1)
dcompose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    log_error "docker compose no disponible."
    printf 'ERR: docker compose no encontrado\n'
    exit 1
  fi
}

# Chequeos mínimos
if ! command -v docker >/dev/null 2>&1; then
  log_error "docker no instalado o no disponible en PATH"
  printf 'ERR: docker no encontrado\n'
  exit 1
fi

# Leer una sola línea literal desde el socket
IFS= read -r cmd || cmd=""
cmd="${cmd%%$'\r'}"  # quitar CR si viene CRLF

case "$cmd" in
  "dockerbub")
    # Evitar ejecuciones concurrentes del mismo comando
    exec 9>"$LOCK_FILE" || { printf 'ERR: no se pudo abrir lock\n'; exit 1; }
    if ! flock -n 9; then
      # No bloquear: indicar ocupado al cliente
      log_warn "dockerbub ya en ejecución; rechazando nueva petición"
      printf 'ERR: busy, try again later\n'
      exit 1
    fi

    # Ejecutar la rutina
    {
      log_info "Iniciando dockerbub: IMAGE=%s SERVICE=%s DIR=%s" "$IMAGE" "$SERVICE" "$COMPOSE_DIR"

      # 1) Pull de la imagen
      log_info "docker pull %s" "$IMAGE"
      docker pull "$IMAGE" >/dev/null

      # 2) Compose rm -sf del servicio
      cd "$COMPOSE_DIR"
      log_info "docker compose rm -sf %s" "$SERVICE"
      dcompose rm -sf "$SERVICE" >/dev/null

      # 3) Compose up -d del servicio
      log_info "docker compose up -d %s" "$SERVICE"
      dcompose up -d "$SERVICE" >/dev/null

      log_info "dockerbub completado OK"
      printf 'OK: agape-app actualizado desde %s\n' "$IMAGE"
    } || {
      # Si algo falla, informamos al cliente brevemente
      log_error "dockerbub falló (ver journal para detalles)"
      printf 'ERR: fallo durante actualización, revisar journal\n'
      exit 1
    }
    ;;

  "")
    printf 'ERR: empty command\n'
    ;;

  *)
    # Comando no permitido (lista blanca estricta)
    printf 'ERR: unknown command\n'
    ;;
esac
