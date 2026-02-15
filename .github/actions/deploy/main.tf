provider "azurerm" {
  features {}
}

provider "cloudflare" {}

provider "digitalocean" {}

data "external" "cloudinit_dyn" {
  program = ["bash", "${path.module}/scripts/cloud-init.tpl.sh"]
  query   = {}
}

data "terraform_remote_state" "core" {
  backend = "azurerm"

  config = {
    resource_group_name  = var.core_state_resource_group_name
    storage_account_name = var.core_state_storage_account_name
    container_name       = var.core_state_container_name
    key                  = var.core_state_key
  }
}

resource "digitalocean_ssh_key" "user" {
  name       = var.digitalocean_ssh_key_name
  public_key = file(var.digitalocean_ssh_public_key_path)
}

resource "digitalocean_droplet" "main" {
  name      = var.digitalocean_droplet_name
  region    = var.digitalocean_region
  image     = var.digitalocean_image
  size      = var.digitalocean_droplet_size
  ssh_keys  = [digitalocean_ssh_key.user.id]
  user_data = data.external.cloudinit_dyn.result.rendered
}

resource "digitalocean_firewall" "ssh_only" {
  name        = "${var.digitalocean_droplet_name}-ssh-only"
  droplet_ids = [digitalocean_droplet.main.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = [var.allowed_ssh_source_cidr]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

resource "cloudflare_dns_record" "digitalocean_a" {
  count   = var.cloudflare_zone_name != null ? 1 : 0
  zone_id = data.terraform_remote_state.core.outputs.cloudflare_zone_id
  name    = var.digitalocean_subdomain
  type    = "A"
  content = digitalocean_droplet.main.ipv4_address
  ttl     = 300
  proxied = false
  comment = "Managed by Terraform - DigitalOcean Droplet"

  lifecycle {
    precondition {
      condition     = data.terraform_remote_state.core.outputs.cloudflare_zone_name == var.cloudflare_zone_name
      error_message = "core state Cloudflare zone name does not match var.cloudflare_zone_name"
    }

    precondition {
      condition     = data.terraform_remote_state.core.outputs.cloudflare_zone_id != null
      error_message = "core state does not expose a valid Cloudflare zone id"
    }
  }
}
