variable "resource_group_name_mapineda48" {
  description = "Nombre del grupo de recursos principal"
  default     = "mapineda48-rg"
  type        = string
}

variable "resource_group_name" {
  description = "Nombre del grupo de recursos"
  default     = "mapineda48-vm-rg"
  type        = string
}

variable "VM_SIZE" {
  description = "Tamaño de la maquina virtual"
  default     = "Standard_B2s"
  type        = string
}

variable "resource_group_location" {
  description = "Localización del grupo de recursos"
  default     = "eastus"
  type        = string
}

variable "dns_zone_name" {
  description = "Nombre de la zona DNS"
  default     = "mapineda48.de"
  type        = string
}

variable "subdomain" {
  type        = string
  default     = "agape-app"
  description = "subdomain"
}

variable "SSH_PUBLIC_KEY" {
  type        = string
  default     = ""
  description = "Clave pública SSH"
}

variable "SOURCE_IP" {
  description = "My public IP for SSH connection"
  default     = "179.1.131.62/31"
  type        = string
}