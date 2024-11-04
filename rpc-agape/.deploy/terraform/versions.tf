terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.100.0"
    }

    random = {
      source = "hashicorp/random"
      version = "3.6.0"
    }
  }

  required_version = ">= 1.8.0"
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}
