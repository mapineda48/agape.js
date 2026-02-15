#!/usr/bin/env bash
set -euo pipefail

# Detect run mode: develop (terminal) or terraform (piped)
if [ -t 0 ]; then
  RUN_MODE="develop"
else
  RUN_MODE="terraform"
fi

log() {
  local msg="$*"
  if [[ "${RUN_MODE:-develop}" == "develop" ]]; then
    echo "[LOG] $msg" >&2
  fi
}

# Variables to substitute (only these will be replaced by envsubst)
VARLIST='${AGAPE_CDN_HOST} ${AGAPE_FQDN} ${AGAPE_EMAIL_ACME} ${AGAPE_ADMIN} ${AGAPE_PASSWORD} ${AGAPE_HOOK} ${AGAPE_SECRET} ${STORAGE_ACCOUNT_NAME} ${STORAGE_ACCOUNT_KEY} ${STORAGE_CONNECTION_STRING} ${STORAGE_DEPLOY_CONTAINER} ${NEON_DATABASE_URI} ${NGROK_AUTHTOKEN} ${NGROK_DEV_DOMAIN} ${RESEND_API_KEY}'

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../cloud-init && pwd)"
TEMPLATE="$SCRIPT_DIR/cloud-init.tpl.yaml"
WRITE_DIR="$SCRIPT_DIR/write_files"
OUTPUT="$SCRIPT_DIR/cloud-init.rendered.yaml"
ENV_FILE="$SCRIPT_DIR/.env"

# Load .env if exists
if [[ -f "$ENV_FILE" ]]; then
  log "ℹ️  Loading environment from: $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  log "✅ .env loaded successfully"
else
  log "⚠️ $ENV_FILE not found; using only environment variables"
fi

# Verify write_files directory exists
if [[ ! -d "$WRITE_DIR" ]]; then
  log "❌ write_files directory not found: $WRITE_DIR"
  exit 1
fi

# Function to generate write_files YAML entries
generate_write_files() {
  find "$WRITE_DIR" -type f | sort | while IFS= read -r file; do
    # Get relative path from write_files directory
    rel="${file#$WRITE_DIR/}"
    
    # Determine permissions based on file extension
    if [[ "$rel" == *.sh ]]; then
      perm="0755"
    else
      perm="0644"
    fi
    
    # Output YAML entry
    echo "  - path: /$rel"
    echo "    permissions: \"$perm\""
    echo "    content: |"
    
    # Read file content and indent with 6 spaces
    while IFS= read -r line || [[ -n "$line" ]]; do
      echo "      $line"
    done < "$file"
    
    echo ""
  done
}

# Build the rendered cloud-init
build_cloudinit() {
  local write_files_inserted=0
  
  while IFS= read -r line || [[ -n "$line" ]]; do
    echo "$line"
    
    # After write_files: line, insert all file entries
    if [[ "$line" == "write_files:"* ]] && [[ $write_files_inserted -eq 0 ]]; then
      generate_write_files
      write_files_inserted=1
    fi
  done < "$TEMPLATE"
}

# Generate the YAML (without variable substitution first)
log "🔧 Generating cloud-init configuration..."
RENDERED_YAML="$(build_cloudinit)"

# Apply envsubst for variable substitution
log "🔄 Applying environment variable substitution..."
FINAL_RENDERED="$(printf '%s' "$RENDERED_YAML" | envsubst "$VARLIST")"

# Output based on run mode
if [[ "$RUN_MODE" == "develop" ]]; then
  log "🧪 Local mode detected"
  printf '%s\n' "$FINAL_RENDERED" > "$OUTPUT"
  log "✅ File generated: $OUTPUT"
else
  # Terraform mode: output JSON
  log "🚀 Running from Terraform"
  jq -n --arg rendered "$FINAL_RENDERED" '{"rendered": $rendered}'
fi
