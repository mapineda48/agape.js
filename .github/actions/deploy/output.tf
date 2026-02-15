output "digitalocean_droplet_id" {
  description = "ID of the DigitalOcean Droplet"
  value       = digitalocean_droplet.main.id
}

output "digitalocean_droplet_ipv4" {
  description = "Public IPv4 of the DigitalOcean Droplet"
  value       = digitalocean_droplet.main.ipv4_address
}

output "digitalocean_fqdn" {
  description = "FQDN pointing to the DigitalOcean Droplet"
  value       = var.cloudflare_zone_name != null ? "${var.digitalocean_subdomain}.${var.cloudflare_zone_name}" : null
}

output "digitalocean_ssh_key_fingerprint" {
  description = "Fingerprint of the uploaded SSH key"
  value       = digitalocean_ssh_key.user.fingerprint
}
