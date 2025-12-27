# Azure Infrastructure Deployment

This directory contains the Terraform configuration and cloud-init scripts to deploy the **Agape.js** application infrastructure on Azure.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
  - [Backend Configuration](#backend-configuration)
  - [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [Initialize Terraform](#initialize-terraform)
  - [Plan and Apply](#plan-and-apply)
- [VM Configuration](#vm-configuration)
  - [Installed Services](#installed-services)
  - [systemd Services](#systemd-services)
  - [Storage Mounts](#storage-mounts)
- [Operations](#operations)
  - [Service Management](#service-management)
  - [Blobfuse2 Management](#blobfuse2-management)
  - [Logs and Debugging](#logs-and-debugging)
  - [Socket Commands](#socket-commands)
- [Monitoring](#monitoring)
  - [Grafana Dashboards](#grafana-dashboards)
- [Security Best Practices](#security-best-practices)
- [References](#references)

---

## Overview

This Terraform project provisions an Azure Linux VM with:
- **Docker** and **Docker Compose** for containerized applications
- **Blobfuse2** for mounting Azure Blob Storage
- **Nginx Proxy** with automatic ACME/Let's Encrypt SSL certificates
- **Monitoring stack**: Prometheus, Loki, Node Exporter, cAdvisor
- **ngrok** for secure tunneling
- **systemd socket activation** for deployment triggers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Azure Cloud                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ DNS Zone    │───▶│  Public IP   │───▶│  Network Security    │   │
│  │ (A Record)  │    │  (Static)    │    │  Group (HTTP/HTTPS)  │   │
│  └─────────────┘    └──────────────┘    └──────────────────────┘   │
│                            │                                        │
│                            ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Linux VM (Ubuntu 22.04)                   │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │                    Docker Compose                      │  │  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │  │  │
│  │  │  │nginx-proxy │  │acme-compan │  │   agape-app      │  │  │  │
│  │  │  │  :80/:443  │  │    ion     │  │     :3000        │  │  │  │
│  │  │  └────────────┘  └────────────┘  └──────────────────┘  │  │  │
│  │  │  ┌────────────┐  ┌────────────┐                        │  │  │
│  │  │  │   redis    │  │socket-bridg│                        │  │  │
│  │  │  │            │  │    e       │                        │  │  │
│  │  │  └────────────┘  └────────────┘                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │                  Monitoring Stack                       │ │  │
│  │  │  Prometheus │ Loki │ Node Exporter │ cAdvisor           │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              Blobfuse2 Mount (/mnt/deploy)              │ │  │
│  │  │  Persistent storage for: certs, vhost, acme state      │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
.github/actions/deploy/
├── README.md                    # This documentation
├── main.tf                      # Main Terraform configuration
├── variables.tf                 # Input variables
├── output.tf                    # Output values
├── backend.tf                   # Terraform backend configuration
├── backend.example.hcl          # Example backend config (safe to commit)
├── .gitignore                   # Git ignore rules
├── scripts/
│   └── cloud-init.tpl.sh        # Cloud-init template processor
└── cloud-init/
    ├── cloud-init.tpl.yaml      # Cloud-init template
    ├── .env.example             # Environment variables example
    └── write_files/             # Files to be written to VM
        ├── etc/
        │   ├── blobfuse2.yaml           # Blobfuse2 configuration
        │   ├── docker/daemon.json       # Docker daemon config
        │   ├── loki/config.yaml         # Loki configuration
        │   ├── nginx/sites-available/   # Nginx virtual hosts
        │   ├── prometheus/prometheus.yml
        │   └── systemd/system/          # systemd service units
        └── opt/mapineda48/
            ├── compose/docker-compose.yml
            └── scripts/                 # Utility scripts
```

---

## Prerequisites

1. **Terraform** >= 1.3.0
2. **Azure CLI** authenticated (`az login`)
3. **SSH Key Pair** (ed25519 recommended)
4. **Azure Resources** (pre-existing):
   - Resource Group for DNS zone
   - DNS Zone configured
   - Storage Account with container for Terraform state

---

## Configuration

### Backend Configuration

Terraform state is stored remotely in Azure Blob Storage. Create a `backend.hcl` file:

```hcl
resource_group_name  = "your-rg"
storage_account_name = "yourstorageaccount"
container_name       = "tfstate"
```

> ⚠️ **Security**: Never commit `backend.hcl` to version control.

### Environment Variables

Copy the example file and configure your environment:

```bash
cp cloud-init/.env.example cloud-init/.env
```

Edit `cloud-init/.env` with your values:

| Variable | Description |
|----------|-------------|
| `AGAPE_FQDN` | Fully qualified domain name (e.g., `agape-app.example.com`) |
| `AGAPE_EMAIL_ACME` | Email for Let's Encrypt notifications |
| `AGAPE_ADMIN` | Admin username for the application |
| `AGAPE_PASSWORD` | Admin password |
| `AGAPE_SECRET` | JWT secret key |
| `AGAPE_HOOK` | Webhook URL for notifications |
| `AGAPE_CDN_HOST` | CDN hostname for static assets |
| `STORAGE_ACCOUNT_NAME` | Azure Storage account name |
| `STORAGE_ACCOUNT_KEY` | Azure Storage account key |
| `STORAGE_CONNECTION_STRING` | Azure Storage connection string |
| `NEON_DATABASE_URI` | PostgreSQL connection string (Neon) |
| `NGROK_AUTHTOKEN` | ngrok authentication token |

---

## Deployment

### Initialize Terraform

First-time setup or after backend changes:

```bash
terraform init -backend-config=backend.hcl
```

If you need to reconfigure the backend:

```bash
terraform init -backend-config=backend.hcl -reconfigure
```

### Plan and Apply

Preview changes:

```bash
terraform plan
```

Apply infrastructure changes:

```bash
terraform apply
```

---

## VM Configuration

### Installed Services

The VM is automatically configured via cloud-init with:

| Component | Version | Purpose |
|-----------|---------|---------|
| Docker CE | Latest | Container runtime |
| Blobfuse2 | Latest | Azure Blob Storage mount |
| Prometheus | 3.7.3 | Metrics collection |
| Loki | 3.5.7 | Log aggregation |
| Node Exporter | 1.10.2 | System metrics |
| cAdvisor | 0.53.0 | Container metrics |
| ngrok | Latest | Secure tunneling |
| Nginx | Latest | Reverse proxy for monitoring |

### systemd Services

| Service | Description |
|---------|-------------|
| `mapineda48-blobfuse2` | Blobfuse2 storage mount (starts before Docker) |
| `mapineda48-prometheus` | Prometheus metrics server |
| `mapineda48-loki` | Loki log aggregator |
| `mapineda48-node-exporter` | Node Exporter metrics |
| `mapineda48-cadvisor` | cAdvisor container metrics |
| `mapineda48-ngrok` | ngrok tunnel (manual start) |
| `mapineda48.socket` | Unix socket for deployment triggers |
| `mapineda48@.service` | Socket-activated handler |

> **Note**: Docker Compose containers use `restart: unless-stopped` policy, which handles automatic restart on boot. The Docker service has a drop-in (`/etc/systemd/system/docker.service.d/mapineda48-deps.conf`) that ensures blobfuse2 is mounted before Docker starts.

### Storage Mounts

Blobfuse2 mounts Azure Blob Storage to `/mnt/deploy`:

```
/mnt/deploy/vm/agape.js/docker/
├── certs/          # SSL certificates
├── vhost.d/        # Nginx virtual host configs
├── html/           # Static HTML for ACME challenges
└── acme/           # ACME state directory
```

---

## Operations

### Service Management

**View service status:**

```bash
# Docker containers
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml ps

# Blobfuse2 mount
sudo systemctl status mapineda48-blobfuse2

# Docker service (includes blobfuse2 dependency)
sudo systemctl status docker

# Monitoring services
sudo systemctl status mapineda48-prometheus
sudo systemctl status mapineda48-loki
sudo systemctl status mapineda48-node-exporter
sudo systemctl status mapineda48-cadvisor

# Socket service
sudo systemctl status mapineda48.socket
```

**Restart services:**

```bash
# Reload systemd and restart socket
sudo systemctl daemon-reload && sudo systemctl restart mapineda48.socket

# Restart Docker Compose stack
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml restart

# Full restart (stop, pull, start)
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml down
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml pull
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml up -d
```

### Blobfuse2 Management

**Check mount status:**

```bash
mount | grep /mnt/deploy
```

**Manual mount (if service is not active):**

```bash
blobfuse2 mount /mnt/deploy --config-file=/etc/blobfuse2.yaml
```

**Unmount:**

```bash
sudo fusermount3 -u /mnt/deploy
```

### Logs and Debugging

**View service logs:**

```bash
# All mapineda48 services
sudo journalctl -u 'mapineda48*' -f

# Specific service
sudo journalctl -u mapineda48-blobfuse2 -f
sudo journalctl -u mapineda48-loki -f

# Docker daemon logs
sudo journalctl -u docker -b

# Docker Compose logs
sudo docker compose -f /opt/mapineda48/compose/docker-compose.yml logs -f
```

**View cloud-init logs:**

```bash
# Initial setup log
cat /var/log/cloud-init.log

# Detailed output log
cat /var/log/cloud-init-output.log

# Follow output in real-time
tail -f /var/log/cloud-init-output.log
```

**View critical boot messages:**

```bash
# Current boot
sudo journalctl -p 3 -b

# Previous boot
sudo journalctl -p 3 -b -1
```

**Inspect systemd service configuration:**

```bash
sudo systemctl cat docker.service
sudo systemctl cat mapineda48-docker-compose
```

### Socket Commands

The VM exposes a Unix socket for remote deployment triggers. Commands are sent via the socket and processed by the handler script.

**Available commands:**

| Command | Description |
|---------|-------------|
| `dockerhub` | Pull latest image and redeploy `agape-app` container |
| `ngrok` | Start ngrok tunnel service |

**Send a command locally:**

```bash
echo "dockerhub" | sudo socat - UNIX-CONNECT:/run/mapineda48.sock
```

**Send a command remotely (via socket-bridge container):**

```bash
curl -X POST https://your-domain.com/deploy -d "dockerhub"
```

---

## Monitoring

### Grafana Dashboards

Recommended dashboards for visualization:

| Dashboard | ID | URL |
|-----------|-----|-----|
| Node Exporter Full | 1860 | [grafana.com/dashboards/1860](https://grafana.com/grafana/dashboards/1860-node-exporter-full/) |
| cAdvisor Dashboard | 19792 | [grafana.com/dashboards/19792](https://grafana.com/grafana/dashboards/19792-cadvisor-dashboard/) |

---

## Security Best Practices

1. **Never commit sensitive files:**
   - `backend.hcl` - Backend configuration
   - `cloud-init/.env` - Environment variables
   - `*.tfstate*` - Terraform state files

2. **SSH Access:**
   - SSH is restricted to a specific IP (`SOURCE_IP` variable)
   - Use ed25519 keys for authentication
   - Password authentication is disabled

3. **Network Security:**
   - Only ports 80 (HTTP) and 443 (HTTPS) are open by default
   - Port 22 (SSH) is conditionally opened based on `SOURCE_IP`

4. **Environment separation:**
   - Use different backend files for each environment:
     ```bash
     terraform init -backend-config=backend-dev.hcl
     terraform init -backend-config=backend-prod.hcl
     ```

---

## References

- [Terraform AzureRM Backend](https://developer.hashicorp.com/terraform/language/settings/backends/azurerm)
- [Blobfuse2 Documentation](https://github.com/Azure/azure-storage-fuse)
- [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy)
- [acme-companion](https://github.com/nginx-proxy/acme-companion)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana Loki](https://grafana.com/docs/loki/)
- [cloud-init Documentation](https://cloudinit.readthedocs.io/)