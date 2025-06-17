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
resource "azurerm_storage_container" "agape_app_storage_tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.agape_app_storage.id
  container_access_type = "private"
}

resource "azurerm_managed_disk" "persistent_data_disk" {
  name                 = "agape-app-data-disk"
  location             = azurerm_resource_group.agape_app_rg.location
  resource_group_name  = azurerm_resource_group.agape_app_rg.name
  storage_account_type = "Standard_LRS"
  create_option        = "Empty"
  disk_size_gb         = 32
}
