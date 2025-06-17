terraform {
  backend "azurerm" {
    resource_group_name  = "agape_app-rg"
    storage_account_name = "dedvx6qpkprsolhkkp1um9e1"
    container_name       = "tfstate"
    key                  = "core.tfstate"
  }
}
