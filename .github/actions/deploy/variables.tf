variable "core_state_resource_group_name" {
  description = "Azure resource group name where the core Terraform state is stored"
  type        = string
  default     = "rg-mapineda48-core"
}

variable "core_state_storage_account_name" {
  description = "Azure storage account name where the core Terraform state is stored"
  type        = string
  default     = "str13b0zxs"
}

variable "core_state_container_name" {
  description = "Azure blob container name where the core Terraform state is stored"
  type        = string
  default     = "data-s1nqfulz"
}

variable "core_state_key" {
  description = "Blob key of the core Terraform state file"
  type        = string
  default     = "tfstate/core.tfstate"
}

variable "cloudflare_zone_name" {
  description = "Cloudflare DNS zone name already managed by the core state"
  type        = string
  default     = "mapineda48.de"
}

variable "digitalocean_region" {
  description = "DigitalOcean region for Droplet resources"
  type        = string
  default     = "fra1"
}

variable "digitalocean_image" {
  description = "DigitalOcean image slug for the Droplet"
  type        = string
  default     = "ubuntu-24-04-x64"
}

variable "digitalocean_droplet_name" {
  description = "Droplet name"
  type        = string
  default     = "agape-app"
}

variable "digitalocean_droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "digitalocean_subdomain" {
  description = "Subdomain for the Droplet A record"
  type        = string
  default     = "agape-app"
}

variable "digitalocean_ssh_key_name" {
  description = "Name used in DigitalOcean for the uploaded SSH key"
  type        = string
  default     = "mapineda48-do"
}

variable "digitalocean_ssh_public_key_path" {
  description = "Path to the SSH public key file that will be uploaded to DigitalOcean"
  type        = string
  default     = "~/.ssh/id_ed25519_digitalocean.pub"
}

variable "allowed_ssh_source_cidr" {
  description = "CIDR allowed to connect via SSH"
  type        = string
  default     = "0.0.0.0/0"
}
