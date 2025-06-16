provider "azurerm" {
  features {}
}

# Grupo de recursos
resource "azurerm_resource_group" "agape_app_rg" {
  name     = "agape_app-rg"
  location = "East US"
}

# Cuenta de almacenamiento
resource "azurerm_storage_account" "agape_app_storage" {
  name                     = "dedvx6qpkprsolhkkp1um9e1" # debe tener entre 3 y 24 caracteres en minúsculas
  resource_group_name      = azurerm_resource_group.agape_app_rg.name
  location                 = azurerm_resource_group.agape_app_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# Contenedor de blobs
resource "azurerm_storage_container" "agape_app" {
  name                  = "agape_app"
  storage_account_name = azurerm_storage_account.agape_app_storage.name
  container_access_type = "private"
}
