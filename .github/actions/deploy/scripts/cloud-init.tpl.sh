#!/usr/bin/env bash
set -euo pipefail

if [ -t 0 ]; then
  RUN_MODE="develop"
else
  RUN_MODE="terraform"
fi

log() {
  local msg="$*"
  if [[ "${RUN_MODE:-develop}" == "develop" ]]; then
    echo "[LOG] $msg"
  fi
}

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../cloud-init && pwd)"
TEMPLATE="$SCRIPT_DIR/cloud-init.tpl.yaml"
WRITE_DIR="$SCRIPT_DIR/write_files"
OUTPUT="$SCRIPT_DIR/cloud-init.rendered.yaml"
ENV_FILE="$SCRIPT_DIR/.env"

# Carga .env si existe
if [[ -f "$ENV_FILE" ]]; then
  log "ℹ️  Cargando entorno desde: $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  log "✅ .env cargado correctamente"
else
  log "⚠️ No se encontró $ENV_FILE; usando solo variables del entorno"
fi

# Verifica que exista la carpeta
if [[ ! -d "$WRITE_DIR" ]]; then
  log "❌ No existe la carpeta write_files en: $WRITE_DIR"
  exit 1
fi

# 1) Ejecuta awk y guarda TODO en una variable
RENDERED_AWK="$(
  awk -v write_dir="$WRITE_DIR" '
    BEGIN { inserted = 0 }
    {
      print $0
      if ($0 ~ /write_files:/ && inserted == 0) {
        # Genera los bloques YAML
        while (( "find \"" write_dir "\" -type f | sort" | getline file ) > 0 ) {
          rel = file
          sub(write_dir "/", "", rel)

          print "  - path: /etc/" rel
          print "    permissions: \"0644\""
          print "    content: |"
          while (( "cat \"" file "\"" | getline line ) > 0 ) {
            print "      " line
          }
          close("cat \"" file "\"")
          print ""
        }
        inserted = 1
      }
    }
  ' "$TEMPLATE"
)"

# 2) Aplica envsubst AL FINAL sobre lo producido por awk
#    (Opción A: sustituir TODAS las variables exportadas)
FINAL_RENDERED="$(printf '%s' "$RENDERED_AWK" | envsubst)"

# Leemos el JSON solo si existe algo en stdin
if [ -t 0 ]; then
  # stdin está conectado a una terminal → no viene de Terraform
  log "🧪 Modo local detectado"
  
    # Escribe el resultado
    printf '%s\n' "$FINAL_RENDERED" > "$OUTPUT"

    log "✅ Archivo generado en: $OUTPUT"
else
  # Terraform envía JSON → stdin no está vacío
  log "🚀 Ejecutado desde Terraform"

  jq -n --arg rendered "$FINAL_RENDERED" '{"rendered": $rendered}'
fi